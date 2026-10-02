from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

from .student_state import StudentState
from .knowledge_graph import CurriculumKnowledgeGraph, build_default_upsc_graph
from .question_bank import QuestionBank, build_default_upsc_question_bank
from .assessment_pipeline import AssessmentPipeline, AssessmentSessionResult
from .engines.scheduler import SchedulerEngine, SessionBlock
from .evidence import ReceiptStore, IntelligenceReceipt
from .events import EventStore, StudentEvent
from .db.session import init_db, get_db_session
from .db.repository import DatabaseRepository
from .session_engine import LearningSessionEngine, TeachingBrief

class StudentService:
    """
    Application / Service Layer for Techgram.
    
    CRITICAL ARCHITECTURAL BOUNDARY:
    Acts as pure orchestrator and repository adapter.
    Contains ZERO pedagogical heuristics (no 'if mastery < 0.4').
    Delegates all modeling, reconciliation, diagnosis, and scheduling to the Kernel.
    Backed by persistent database with snapshotting and event sourcing.
    """
    def __init__(
        self,
        knowledge_graph: Optional[CurriculumKnowledgeGraph] = None,
        question_bank: Optional[QuestionBank] = None,
        db_repository: Optional[DatabaseRepository] = None
    ):
        self.knowledge_graph = knowledge_graph or build_default_upsc_graph()
        self.question_bank = question_bank or build_default_upsc_question_bank()
        
        # Initialize database persistence
        init_db()
        self.db_repo = db_repository or DatabaseRepository(get_db_session())
        
        self.event_store = EventStore()
        self.receipt_store = ReceiptStore()
        
        self.pipeline = AssessmentPipeline(
            question_bank=self.question_bank,
            knowledge_graph=self.knowledge_graph,
            event_store=self.event_store,
            receipt_store=self.receipt_store
        )
        self.scheduler = SchedulerEngine()
        self.session_engine = LearningSessionEngine(
            scheduler_engine=self.scheduler,
            knowledge_graph=self.knowledge_graph,
            question_bank=self.question_bank
        )
        
        # In-memory hot cache
        self._students: Dict[str, StudentState] = {}

    def _get_or_load_state(self, student_id: str) -> Optional[StudentState]:
        """Resolves student state from hot memory or rehydrates from persistent DB snapshot."""
        if student_id in self._students:
            return self._students[student_id]
        
        loaded = self.db_repo.load_latest_student_state(student_id)
        if loaded:
            self._students[student_id] = loaded
        return loaded

    # ---------------------------------------------------------
    # User Identity & Authentication (Decoupled from Intelligence)
    # ---------------------------------------------------------
    def register_user(self, email: str, password: str, full_name: str) -> Dict[str, Any]:
        """Registers a new user account with hashed credentials."""
        existing = self.db_repo.get_user_by_email(email)
        if existing:
            raise ValueError(f"User with email '{email}' already registered")
        
        from .auth import hash_password, create_access_token
        h_pw = hash_password(password)
        user = self.db_repo.create_user(email=email, hashed_password=h_pw, full_name=full_name)
        
        token = create_access_token({"sub": user.user_id, "email": user.email})
        return {
            "user_id": user.user_id,
            "email": user.email,
            "full_name": user.full_name,
            "access_token": token,
            "token_type": "bearer"
        }

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticates user credentials and returns JWT bearer token."""
        user = self.db_repo.get_user_by_email(email)
        if not user:
            raise ValueError("Invalid email or password")
        
        from .auth import verify_password, create_access_token
        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
            
        token = create_access_token({"sub": user.user_id, "email": user.email})
        return {
            "user_id": user.user_id,
            "email": user.email,
            "full_name": user.full_name,
            "access_token": token,
            "token_type": "bearer"
        }

    def onboard_student(
        self,
        name: str,
        goal: str = "UPSC CSE 2027",
        target_exam_date: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a new learner state, persists to DB, and registers onboarding event."""
        student_id = uuid.uuid4()
        sid_str = str(student_id)
        state = StudentState(student_id=student_id)
        
        # Record goal in student state
        state._goal_data["target"] = {
            "goal": goal,
            "target_date": target_exam_date or "2027-05-23",
            "enrolled_at": datetime.now().isoformat(),
            "user_id": user_id
        }
        
        # Save student record & initial snapshot to DB
        self.db_repo.save_student(sid_str, name, goal, target_exam_date, user_id=user_id)
        self.db_repo.save_state_snapshot(state)
        self._students[sid_str] = state
        
        onboard_event = StudentEvent(
            student_id=student_id,
            event_type="goal_set",
            payload={"name": name, "goal": goal, "target_date": target_exam_date, "user_id": user_id},
            source="system"
        )
        self.event_store.emit(onboard_event)
        self.db_repo.append_event(onboard_event)
        
        return {
            "student_id": sid_str,
            "user_id": user_id,
            "name": name,
            "goal": goal,
            "status": "onboarded",
            "onboarded_at": datetime.now().isoformat()
        }

    def get_student_state(self, student_id: str) -> Optional[Dict[str, Any]]:
        state = self._get_or_load_state(student_id)
        if not state:
            return None
        return state.full_state()

    def submit_assessment(
        self,
        student_id: str,
        knowledge_node: str,
        subject: str,
        responses: List[Dict[str, Any]],
        self_reported_confidence: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Submits item responses to the kernel assessment pipeline and commits state snapshot to DB.
        """
        state = self._get_or_load_state(student_id)
        if not state:
            return None

        if not responses:
            raise ValueError("Responses list cannot be empty; at least one item response is required")

        # Check for duplicate question responses within single session
        seen_qids = set()
        for r in responses:
            qid = r.get("question_id")
            if not qid:
                raise ValueError("Each response must contain a valid 'question_id'")
            if qid in seen_qids:
                raise ValueError(f"Duplicate response for question '{qid}' in single session submission")
            seen_qids.add(qid)

        # Resolve questions from QuestionBank
        item_responses = []
        for r in responses:
            qid = r["question_id"]
            selected_idx = r.get("selected_option_index")
            q = self.question_bank.get_question(qid)
            if q is None:
                raise ValueError(f"Question '{qid}' not found in QuestionBank")
            
            is_correct = (selected_idx == q.correct_option_index) if selected_idx is not None else False
            item_responses.append((q, is_correct))

        # Process through deterministic assessment pipeline
        res: AssessmentSessionResult = self.pipeline.process_assessment_responses(
            student_state=state,
            knowledge_node=knowledge_node,
            subject=subject,
            item_responses=item_responses,
            self_reported_confidence=self_reported_confidence
        )

        # Persist events, receipt, and state snapshot to DB
        for q, is_correct in item_responses:
            ev = StudentEvent(
                student_id=state.student_id,
                event_type="item_response",
                payload={
                    "session_id": res.session_id,
                    "question_id": q.question_id,
                    "knowledge_node": knowledge_node,
                    "is_correct": is_correct
                },
                source="assessment_pipeline",
                session_id=uuid.UUID(res.session_id)
            )
            self.db_repo.append_event(ev)

        receipt = self.receipt_store.get(res.intelligence_receipt_id)
        if receipt:
            self.db_repo.save_receipt(receipt)

        self.db_repo.save_state_snapshot(state, latest_event_id=res.session_id)

        return {
            "session_id": res.session_id,
            "student_id": res.student_id,
            "topic": res.topic,
            "items_administered": res.items_administered,
            "correct_count": res.correct_count,
            "irt_ability": res.irt_ability,
            "irt_se": res.irt_se,
            "bkt_mastery": round(res.bkt_mastery, 4),
            "reconciled_vector": res.reconciled_vector.to_dict(),
            "root_cause_diagnosis": res.root_cause_diagnosis,
            "intelligence_receipt_id": res.intelligence_receipt_id
        }

    def get_schedule(
        self,
        student_id: str,
        n_blocks: int = 5,
        block_duration: int = 40
    ) -> Optional[List[Dict[str, Any]]]:
        state = self._get_or_load_state(student_id)
        if not state:
            return None

        blocks: List[SessionBlock] = self.scheduler.generate_schedule(
            student_state=state,
            knowledge_graph=self.knowledge_graph,
            n_blocks=n_blocks,
            block_duration=block_duration
        )
        return [b.to_dict() for b in blocks]

    def get_receipt(self, receipt_id: str) -> Optional[Dict[str, Any]]:
        # Check hot memory receipt store first, then fallback to DB
        receipt = self.receipt_store.get(receipt_id)
        if receipt:
            return receipt.to_dict()
        return self.db_repo.get_receipt(receipt_id)

    # ---------------------------------------------------------
    # Learning Session Lifecycle
    # ---------------------------------------------------------
    def start_learning_session(
        self,
        student_id: str,
        topic: Optional[str] = None,
        subject: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Initializes an active learning session driven by the kernel's deterministic brief.
        1. Reads student state.
        2. Generates TeachingBrief.
        3. Persists session to database.
        4. Emits session_started event.
        """
        state = self._get_or_load_state(student_id)
        if not state:
            return None

        brief = self.session_engine.create_teaching_brief(
            student_state=state,
            topic=topic,
            subject=subject
        )

        session_id = str(uuid.uuid4())
        session_type = "prerequisite_remediation" if brief.root_cause_deficit else "learn"
        if brief.pedagogical_action == "investigation_probe":
            session_type = "investigate_probe"

        self.db_repo.create_learning_session(
            session_id=session_id,
            student_id=student_id,
            topic=brief.topic,
            subject=brief.subject,
            session_type=session_type,
            target_learning_objective=brief.target_learning_objective,
            pedagogical_action=brief.pedagogical_action
        )

        start_event = StudentEvent(
            student_id=uuid.UUID(student_id),
            event_type="session_started",
            payload={
                "session_id": session_id,
                "topic": brief.topic,
                "subject": brief.subject,
                "pedagogical_action": brief.pedagogical_action,
                "cognitive_dimension": brief.cognitive_dimension
            },
            source="session_engine",
            session_id=uuid.UUID(session_id)
        )
        self.event_store.emit(start_event)
        self.db_repo.append_event(start_event)

        return {
            "session_id": session_id,
            "student_id": student_id,
            "topic": brief.topic,
            "subject": brief.subject,
            "status": "active",
            "current_phase": "instruction",
            "teaching_brief": brief.to_dict()
        }

    def record_session_interaction(
        self,
        session_id: str,
        turn_role: str,
        content: str,
        next_phase: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Logs a dialog turn (student or teacher) and optionally advances the session phase."""
        session_data = self.db_repo.get_learning_session(session_id)
        if not session_data or session_data["status"] != "active":
            return None

        turn = {
            "role": turn_role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        return self.db_repo.append_session_interaction(session_id, turn, next_phase=next_phase)

    def complete_learning_session(
        self,
        session_id: str,
        summary: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Closes a learning session, updates the database, and emits session_completed event."""
        session_data = self.db_repo.get_learning_session(session_id)
        if not session_data or session_data["status"] != "active":
            return None

        res = self.db_repo.complete_learning_session(session_id)
        student_id = session_data["student_id"]

        comp_event = StudentEvent(
            student_id=uuid.UUID(student_id),
            event_type="session_completed",
            payload={
                "session_id": session_id,
                "topic": session_data["topic"],
                "subject": session_data["subject"],
                "turns_count": len(session_data.get("session_log", [])),
                "summary": summary
            },
            source="session_engine",
            session_id=uuid.UUID(session_id)
        )
        self.event_store.emit(comp_event)
        self.db_repo.append_event(comp_event)

        return {
            "session_id": session_id,
            "status": "completed",
            "completed_at": res["completed_at"]
        }

    def get_learning_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.db_repo.get_learning_session(session_id)

    def replay_events_for_student(self, student_id: str) -> StudentState:
        """
        DETERMINISTIC EVENT REPLAY:
        Reconstructs the full student state from scratch by replaying the raw immutable event history.
        """
        events = self.db_repo.get_events_for_student(student_id)
        replayed_state = StudentState(student_id=uuid.UUID(student_id))

        for ev in events:
            if ev.event_type == "goal_set":
                replayed_state._goal_data["target"] = ev.payload
            elif ev.event_type == "item_response":
                payload = ev.payload
                qid = payload["question_id"]
                node = payload["knowledge_node"]
                is_correct = payload["is_correct"]
                q = self.question_bank.get_question(qid)
                if q:
                    # Execute single-step update through pipeline without emitting side effects
                    prior_tm = replayed_state._topic_masteries.get(node)
                    prior_bkt = prior_tm.vector.recognition.value if (prior_tm and prior_tm.vector.recognition.value is not None) else 0.30
                    current_bkt = self.pipeline.bkt_model.update(prior_bkt, is_correct)
                    irt_ability, irt_se = self.pipeline.irt_model.estimate_ability([(q, is_correct)], prior_ability=0.0)
                    
                    vec = self.pipeline.pipeline_reconciliation = self.db_repo.load_latest_student_state(student_id)
                    # Use existing state reconciliation
                    from .engines.reconciliation import StateReconciliationEngine
                    reconciled = StateReconciliationEngine.reconcile_topic(
                        topic=node,
                        subject="Geography" if "GEO" in qid else "Polity",
                        bkt_mastery=current_bkt,
                        irt_ability=irt_ability,
                        retention_decay=0.92,
                        observed_responses_count=1
                    )
                    replayed_state.update_topic_vector(node, "Geography" if "GEO" in qid else "Polity", reconciled)

        return replayed_state
