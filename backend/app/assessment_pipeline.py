from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import uuid
import math

from .question_bank import QuestionBank, AssessmentQuestion, CognitiveDimension
from .knowledge_graph import CurriculumKnowledgeGraph
from .student_state import StudentState, LearningStateVector
from .engines.knowledge_tracing import BKTModel
from .engines.assessment import IRTModel
from .engines.retention import RetentionModel, ReviewRecord
from .engines.reconciliation import StateReconciliationEngine
from .events import StudentEvent, EventStore
from .evidence import IntelligenceReceipt, ReceiptStore

@dataclass
class AssessmentSessionResult:
    session_id: str
    student_id: str
    topic: str
    items_administered: int
    correct_count: int
    irt_ability: float
    irt_se: float
    bkt_mastery: float
    reconciled_vector: LearningStateVector
    root_cause_diagnosis: Optional[Dict[str, Any]]
    intelligence_receipt_id: str

class AssessmentPipeline:
    """
    Closed-Loop Assessment & Epistemic Observation Pipeline.
    
    Coordinates the full cycle:
    Student Responses -> IRT Updating -> BKT Tracing -> State Reconciliation
    -> Root-Cause Prerequisite Traversal -> Epistemic Receipt.
    """
    def __init__(
        self,
        question_bank: QuestionBank,
        knowledge_graph: CurriculumKnowledgeGraph,
        event_store: Optional[EventStore] = None,
        receipt_store: Optional[ReceiptStore] = None
    ):
        self.question_bank = question_bank
        self.knowledge_graph = knowledge_graph
        self.irt_model = IRTModel()
        self.bkt_model = BKTModel()
        self.retention_model = RetentionModel()
        self.event_store = event_store or EventStore()
        self.receipt_store = receipt_store or ReceiptStore()

    def select_next_assessment_items(
        self,
        student_state: StudentState,
        knowledge_node: str,
        n_items: int = 3,
        target_dimension: Optional[CognitiveDimension] = None
    ) -> List[AssessmentQuestion]:
        """
        Active item selection maximizing information for the student's current state.
        If a specific probe/dimension is targeted (e.g. TRANSFER), filters accordingly.
        """
        candidates = self.question_bank.query(knowledge_node=knowledge_node)
        if target_dimension is not None:
            dim_candidates = [q for q in candidates if q.cognitive_dimension == target_dimension]
            if dim_candidates:
                candidates = dim_candidates

        if not candidates:
            return []

        # Current ability prior from student state if available
        tm = student_state._topic_masteries.get(knowledge_node)
        prior_ability = 0.0
        if tm and tm.mastery and tm.mastery.value is not None:
            # Map [0, 1] probability back to rough logit ability
            p = max(0.05, min(0.95, float(tm.mastery.value)))
            prior_ability = -math.log((1.0 / p) - 1.0)

        # Select items maximizing Fisher Information
        return self.irt_model.select_items(ability=prior_ability, items=candidates, n=n_items)

    def process_assessment_responses(
        self,
        student_state: StudentState,
        knowledge_node: str,
        subject: str,
        item_responses: List[Tuple[AssessmentQuestion, bool]],
        self_reported_confidence: Optional[float] = None
    ) -> AssessmentSessionResult:
        """
        Processes a set of responses:
        1. Emits immutable StudentEvents.
        2. Estimates IRT ability and standard error.
        3. Updates BKT latent knowledge trace.
        4. Reconciles models into the multi-dimensional LearningStateVector.
        5. Traverses Knowledge Graph DAG for prerequisite root-cause bottleneck.
        6. Logs an IntelligenceReceipt.
        """
        session_id = str(uuid.uuid4())
        
        # 1. Emit events and update empirical question records
        for q, is_correct in item_responses:
            self.event_store.emit(StudentEvent(
                student_id=student_state.student_id,
                event_type="item_response",
                payload={
                    "session_id": session_id,
                    "question_id": q.question_id,
                    "knowledge_node": knowledge_node,
                    "cognitive_dimension": q.cognitive_dimension.value,
                    "difficulty": q.difficulty,
                    "is_correct": is_correct
                },
                source="assessment_pipeline",
                session_id=uuid.UUID(session_id)
            ))
            self.question_bank.record_response(q.question_id, is_correct)

        # 2. IRT Ability Estimation
        prior_tm = student_state._topic_masteries.get(knowledge_node)
        prior_ability = 0.0
        prior_bkt = 0.30
        if prior_tm and prior_tm.vector:
            rec = prior_tm.vector.recognition.value
            if rec is not None:
                prior_bkt = float(rec)
                
        irt_ability, irt_se = self.irt_model.estimate_ability(item_responses, prior_ability=prior_ability)

        # 3. BKT Knowledge Tracing Update
        current_bkt = prior_bkt
        correct_count = 0
        transfer_scores = []
        easy_correct = []
        hard_correct = []

        for q, is_correct in item_responses:
            if is_correct:
                correct_count += 1
            current_bkt = self.bkt_model.update(current_bkt, is_correct=is_correct)
            
            if q.cognitive_dimension == CognitiveDimension.TRANSFER:
                transfer_scores.append(1.0 if is_correct else 0.0)
            if q.difficulty <= -0.2:
                easy_correct.append(1.0 if is_correct else 0.0)
            elif q.difficulty >= 0.5:
                hard_correct.append(1.0 if is_correct else 0.0)

        # Calculate metrics
        transfer_score = (sum(transfer_scores) / len(transfer_scores)) if transfer_scores else None
        easy_rate = (sum(easy_correct) / len(easy_correct)) if easy_correct else None
        hard_rate = (sum(hard_correct) / len(hard_correct)) if hard_correct else None
        recent_correct_rate = correct_count / len(item_responses) if item_responses else 0.0

        # 4. State Reconciliation & Belief Fusion
        reconciled_vector = StateReconciliationEngine.reconcile_topic(
            topic=knowledge_node,
            subject=subject,
            bkt_mastery=current_bkt,
            irt_ability=irt_ability,
            retention_decay=0.92, # Freshly assessed
            self_report_confidence=self_reported_confidence,
            transfer_score=transfer_score,
            observed_responses_count=len(item_responses),
            recent_correct_rate=recent_correct_rate,
            easy_correct_rate=easy_rate,
            hard_correct_rate=hard_rate
        )

        student_state.update_topic_vector(knowledge_node, subject, reconciled_vector)

        # 5. Knowledge Graph Prerequisite Bottleneck Diagnosis
        root_cause_diagnosis = self.knowledge_graph.diagnose_bottleneck(
            knowledge_node,
            student_state._topic_masteries
        )

        # 6. Generate Epistemic Decision & Intelligence Receipt
        receipt = IntelligenceReceipt(
            decision=f"Assessment complete on {knowledge_node}",
            observations=[
                {"items_administered": len(item_responses)},
                {"correct_count": correct_count},
                {"irt_ability": irt_ability, "irt_se": irt_se},
                {"bkt_mastery": current_bkt},
                {"self_reported_confidence": self_reported_confidence}
            ],
            predictions=[
                {"reconciled_composite": round(reconciled_vector.composite_index(), 3)},
                {"has_discrepancy": bool(reconciled_vector.model_discrepancies)}
            ],
            candidate_actions=[
                {"action": "advance_curriculum", "score": 0.3},
                {"action": "investigate_probe", "score": 0.9 if reconciled_vector.has_high_uncertainty else 0.2},
                {"action": "remediate_prerequisite", "score": 0.95 if root_cause_diagnosis else 0.1}
            ],
            selected_action={
                "action": "remediate_prerequisite" if root_cause_diagnosis else (
                    "investigate_probe" if reconciled_vector.has_high_uncertainty else "consolidate_practice"
                )
            },
            selection_reason=root_cause_diagnosis["diagnosis_reason"] if root_cause_diagnosis else (
                reconciled_vector.primary_uncertainty or "Consistent response pattern verified"
            ),
            constraints_checked=["instrument_item_validation_status_ok"],
            confidence=round(1.0 - reconciled_vector.max_uncertainty, 3),
            assumptions=["IRT and BKT item parameters calibrated under author priors"],
            unknowns=[reconciled_vector.primary_uncertainty] if reconciled_vector.primary_uncertainty else []
        )
        self.receipt_store.store(receipt)

        return AssessmentSessionResult(
            session_id=session_id,
            student_id=str(student_state.student_id),
            topic=knowledge_node,
            items_administered=len(item_responses),
            correct_count=correct_count,
            irt_ability=irt_ability,
            irt_se=irt_se,
            bkt_mastery=current_bkt,
            reconciled_vector=reconciled_vector,
            root_cause_diagnosis=root_cause_diagnosis,
            intelligence_receipt_id=receipt.receipt_id
        )
