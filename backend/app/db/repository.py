import datetime
import uuid
import threading
from contextlib import contextmanager
from sqlalchemy import text
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, sessionmaker

from .models import (
    UserModel, StudentModel, StudentEventModel, StateSnapshotModel,
    LearningSessionModel, ItemCalibrationHistoryModel, IntelligenceReceiptModel
)
from ..student_state import StudentState, LearningStateVector, TopicMastery
from ..epistemics import LearningEnvelope
from ..events import StudentEvent
from ..evidence import IntelligenceReceipt

class DatabaseRepository:
    """
    Persistence & State Reconstruction Repository.
    Thread-safe session operations across SQLite & PostgreSQL.
    Supports session factory or individual session injection.
    """
    def __init__(self, session_or_factory):
        if isinstance(session_or_factory, sessionmaker):
            self.session_factory = session_or_factory
            self._direct_session = None
        else:
            self.session_factory = None
            self._direct_session = session_or_factory
        self._lock = threading.RLock()
        self._in_transaction = False

    @contextmanager
    def transaction(self):
        """One atomic command, with database locks shared by all workers."""
        with self._lock:
            if self._in_transaction:
                yield
                return
            original_factory = self.session_factory
            original_session = self._direct_session
            session = self._get_session()
            self.session_factory = None
            self._direct_session = session
            self._in_transaction = True
            try:
                # Clear any read transaction before acquiring the write lock.
                session.rollback()
                if session.bind.dialect.name == "sqlite":
                    session.execute(text("BEGIN IMMEDIATE"))
                yield
                session.commit()
            except BaseException:
                session.rollback()
                raise
            finally:
                self._in_transaction = False
                self.session_factory = original_factory
                self._direct_session = original_session
                if original_factory:
                    session.close()

    def _persist(self, session):
        if self._in_transaction:
            session.flush()
        else:
            session.commit()

    def lock_student(self, student_id):
        if self._in_transaction:
            self._direct_session.query(StudentModel).filter_by(student_id=student_id).with_for_update().first()

    def lock_session(self, session_id):
        if self._in_transaction:
            self._direct_session.query(LearningSessionModel).filter_by(session_id=session_id).with_for_update().first()


    def _get_session(self) -> Session:
        if self.session_factory:
            return self.session_factory()
        return self._direct_session

    # ---------------------------------------------------------
    # User Identity & Authentication Operations
    # ---------------------------------------------------------
    def create_user(self, email: str, hashed_password: str, full_name: str) -> UserModel:
        with self._lock:
            session = self._get_session()
            try:
                user = UserModel(
                    user_id=str(uuid.uuid4()),
                    email=email.strip().lower(),
                    hashed_password=hashed_password,
                    full_name=full_name.strip()
                )
                session.add(user)
                self._persist(session)
                return user
            finally:
                if self.session_factory:
                    session.close()

    def get_user_by_email(self, email: str) -> Optional[UserModel]:
        with self._lock:
            session = self._get_session()
            try:
                return session.query(UserModel).filter_by(email=email.strip().lower()).first()
            finally:
                if self.session_factory:
                    session.close()

    def get_user_by_id(self, user_id: str) -> Optional[UserModel]:
        with self._lock:
            session = self._get_session()
            try:
                return session.query(UserModel).filter_by(user_id=user_id).first()
            finally:
                if self.session_factory:
                    session.close()

    # ---------------------------------------------------------
    # Student Operations
    # ---------------------------------------------------------
    def save_student(
        self,
        student_id: str,
        name: str,
        goal: str,
        target_exam_date: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> StudentModel:
        with self._lock:
            session = self._get_session()
            try:
                model = session.query(StudentModel).filter_by(student_id=student_id).first()
                if not model:
                    model = StudentModel(
                        student_id=student_id,
                        user_id=user_id,
                        name=name,
                        goal=goal,
                        target_exam_date=target_exam_date
                    )
                    session.add(model)
                    self._persist(session)
                return model
            finally:
                if self.session_factory:
                    session.close()

    def get_student(self, student_id: str) -> Optional[StudentModel]:
        with self._lock:
            session = self._get_session()
            try:
                return session.query(StudentModel).filter_by(student_id=student_id).first()
            finally:
                if self.session_factory:
                    session.close()

    # ---------------------------------------------------------
    # Immutable Event Log
    # ---------------------------------------------------------
    def append_event(self, event: StudentEvent) -> StudentEventModel:
        with self._lock:
            session = self._get_session()
            try:
                model = StudentEventModel(
                    event_id=str(event.event_id),
                    student_id=str(event.student_id),
                    session_id=str(event.session_id) if event.session_id else None,
                    event_type=event.event_type,
                    payload=event.payload,
                    source=event.source,
                    timestamp=event.timestamp
                )
                session.add(model)
                self._persist(session)
                return model
            finally:
                if self.session_factory:
                    session.close()

    def get_events_for_student(self, student_id: str) -> List[StudentEvent]:
        with self._lock:
            session = self._get_session()
            try:
                rows = session.query(StudentEventModel).filter_by(student_id=student_id).order_by(StudentEventModel.timestamp.asc(), StudentEventModel.event_id.asc()).all()
                events = []
                for r in rows:
                    ev = StudentEvent(
                        event_id=uuid.UUID(r.event_id),
                        student_id=uuid.UUID(r.student_id),
                        event_type=r.event_type,
                        payload=r.payload,
                        source=r.source,
                        timestamp=r.timestamp,
                        session_id=uuid.UUID(r.session_id) if r.session_id else None
                    )
                    events.append(ev)
                return events
            finally:
                if self.session_factory:
                    session.close()

    # ---------------------------------------------------------
    # State Snapshot & Deserialization
    # ---------------------------------------------------------
    def save_state_snapshot(self, student_state: StudentState, latest_event_id: Optional[str] = None) -> StateSnapshotModel:
        with self._lock:
            session = self._get_session()
            try:
                sid_str = str(student_state.student_id)
                snapshot = StateSnapshotModel(
                    student_id=sid_str,
                    state_json=student_state.full_state(),
                    latest_event_id=latest_event_id
                )
                session.add(snapshot)
                self._persist(session)
                return snapshot
            finally:
                if self.session_factory:
                    session.close()

    def load_latest_student_state(self, student_id: str) -> Optional[StudentState]:
        """Loads and rehydrates a full StudentState from the latest database snapshot."""
        with self._lock:
            session = self._get_session()
            try:
                snapshot = session.query(StateSnapshotModel).filter_by(student_id=student_id).order_by(StateSnapshotModel.created_at.desc()).first()
                if not snapshot:
                    student = self.get_student(student_id)
                    if not student:
                        return None
                    return StudentState(student_id=uuid.UUID(student_id))

                return self.deserialize_state(snapshot.state_json)
            finally:
                if self.session_factory:
                    session.close()

    # ---------------------------------------------------------
    # Intelligence Receipts
    # ---------------------------------------------------------
    def save_receipt(self, receipt: IntelligenceReceipt, student_id: Optional[str] = None) -> IntelligenceReceiptModel:
        with self._lock:
            session = self._get_session()
            try:
                model = IntelligenceReceiptModel(
                    receipt_id=receipt.receipt_id,
                    student_id=student_id,
                    decision=receipt.decision,
                    timestamp=receipt.timestamp,
                    confidence=receipt.confidence,
                    selection_reason=receipt.selection_reason,
                    observations=receipt.observations,
                    predictions=receipt.predictions,
                    candidate_actions=receipt.candidate_actions,
                    selected_action=receipt.selected_action,
                    constraints_checked=receipt.constraints_checked,
                    assumptions=receipt.assumptions,
                    unknowns=receipt.unknowns
                )
                session.add(model)
                self._persist(session)
                return model
            finally:
                if self.session_factory:
                    session.close()

    def get_receipt(self, receipt_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            session = self._get_session()
            try:
                row = session.query(IntelligenceReceiptModel).filter_by(receipt_id=receipt_id).first()
                if not row:
                    return None
                return {
                    "receipt_id": row.receipt_id,
                    "decision": row.decision,
                    "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                    "confidence": row.confidence,
                    "selection_reason": row.selection_reason,
                    "observations": row.observations,
                    "predictions": row.predictions,
                    "candidate_actions": row.candidate_actions,
                    "selected_action": row.selected_action,
                    "constraints_checked": row.constraints_checked,
                    "assumptions": row.assumptions,
                    "unknowns": row.unknowns
                }
            finally:
                if self.session_factory:
                    session.close()

    # ---------------------------------------------------------
    # Learning Session Operations
    # ---------------------------------------------------------
    def create_learning_session(
        self,
        session_id: str,
        student_id: str,
        topic: str,
        subject: str,
        session_type: str,
        target_learning_objective: Optional[str] = None,
        pedagogical_action: Optional[str] = None
    ) -> LearningSessionModel:
        with self._lock:
            session = self._get_session()
            try:
                model = LearningSessionModel(
                    session_id=session_id,
                    student_id=student_id,
                    topic=topic,
                    subject=subject,
                    session_type=session_type,
                    status="active",
                    current_phase="instruction",
                    target_learning_objective=target_learning_objective,
                    pedagogical_action=pedagogical_action,
                    session_log=[]
                )
                session.add(model)
                self._persist(session)
                return model
            finally:
                if self.session_factory:
                    session.close()

    def get_learning_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            session = self._get_session()
            try:
                row = session.query(LearningSessionModel).filter_by(session_id=session_id).first()
                if not row:
                    return None
                return {
                    "session_id": row.session_id,
                    "student_id": row.student_id,
                    "topic": row.topic,
                    "subject": row.subject,
                    "session_type": row.session_type,
                    "status": row.status,
                    "current_phase": row.current_phase,
                    "target_learning_objective": row.target_learning_objective,
                    "pedagogical_action": row.pedagogical_action,
                    "started_at": row.started_at.isoformat() if row.started_at else None,
                    "completed_at": row.completed_at.isoformat() if row.completed_at else None,
                    "session_log": row.session_log
                }
            finally:
                if self.session_factory:
                    session.close()

    def append_session_interaction(self, session_id: str, turn: Dict[str, Any], next_phase: Optional[str] = None) -> Optional[Dict[str, Any]]:
        with self._lock:
            session = self._get_session()
            try:
                row = session.query(LearningSessionModel).filter_by(session_id=session_id).first()
                if not row:
                    return None
                log = list(row.session_log or [])
                log.append(turn)
                row.session_log = log
                if next_phase:
                    row.current_phase = next_phase
                self._persist(session)
                return {
                    "session_id": row.session_id,
                    "current_phase": row.current_phase,
                    "turn_count": len(log)
                }
            finally:
                if self.session_factory:
                    session.close()

    def complete_learning_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            session = self._get_session()
            try:
                row = session.query(LearningSessionModel).filter_by(session_id=session_id).first()
                if not row:
                    return None
                row.status = "completed"
                row.current_phase = "completed"
                row.completed_at = datetime.datetime.utcnow()
                self._persist(session)
                return {
                    "session_id": row.session_id,
                    "status": row.status,
                    "completed_at": row.completed_at.isoformat()
                }
            finally:
                if self.session_factory:
                    session.close()

    @staticmethod
    def deserialize_state(data):
        state = StudentState(student_id=uuid.UUID(data["student_id"]))

        cog = data.get("cognitive", {})
        topic_masteries = cog.get("topic_masteries", {})
        for topic_name, tm_data in topic_masteries.items():
            subj = tm_data.get("subject", "General")
            v_data = tm_data.get("vector", {})

            def _parse_env(e_dict):
                if not e_dict:
                    return LearningEnvelope.unknown("probability", "unknown")
                obs_at = e_dict.get("observed_at")
                if isinstance(obs_at, str):
                    try:
                        obs_dt = datetime.datetime.fromisoformat(obs_at)
                    except:
                        obs_dt = datetime.datetime.utcnow()
                else:
                    obs_dt = datetime.datetime.utcnow()

                envelope = LearningEnvelope(
                    value=e_dict.get("value"),
                    unit=e_dict.get("unit", "probability"),
                    knowledge_type=e_dict.get("knowledge_type", "computed"),
                    observation_basis=e_dict.get("observation_basis", "state_fusion"),
                    observed_at=obs_dt,
                    confidence=e_dict.get("confidence", 0.5),
                    sample_size=e_dict.get("sample_size", 0),
                    uncertainty=e_dict.get("uncertainty", 0.1),
                    value_semantics=e_dict.get("value_semantics", "estimate"),
                    model_id=e_dict.get("model_id"),
                    model_version=e_dict.get("model_version"),
                    decay_model=e_dict.get("decay_model"),
                    decay_halflife_days=e_dict.get("decay_halflife_days"),
                    source_trust=e_dict.get("source_trust", 1.0),
                )
                # Rehydration must not apply elapsed-time mutation a second time.
                valid = e_dict.get("valid_until")
                envelope.valid_until = datetime.datetime.fromisoformat(valid) if isinstance(valid, str) else valid
                return envelope

            vec = LearningStateVector(
                recall=_parse_env(v_data.get("recall")),
                recognition=_parse_env(v_data.get("recognition")),
                conceptual=_parse_env(v_data.get("conceptual")),
                application=_parse_env(v_data.get("application")),
                transfer=_parse_env(v_data.get("transfer")),
                retention=_parse_env(v_data.get("retention")) if v_data.get("retention") else None,
                fluency=_parse_env(v_data.get("fluency")) if v_data.get("fluency") else None,
                model_discrepancies=v_data.get("model_discrepancies", []),
                primary_uncertainty=v_data.get("primary_uncertainty"),
                recommended_probe_type=v_data.get("recommended_probe_type")
            )
            state.update_topic_vector(topic_name, subj, vec)
            mastery = state._topic_masteries[topic_name]
            mastery.review_count = tm_data.get("review_count", 0)
            last_reviewed = tm_data.get("last_reviewed")
            mastery.last_reviewed = datetime.datetime.fromisoformat(last_reviewed) if isinstance(last_reviewed, str) else last_reviewed

        beliefs = data.get("belief", {})
        for dim, dist in beliefs.items():
            state.update_belief_distribution(dim, dist)

        for domain in ("behavioral", "metacognitive", "skill", "engagement", "context", "uncertainty"):
            setattr(state, "_" + domain + "_data", data.get(domain, {}))
        state._goal_data = data.get("goal", {})
        return state
