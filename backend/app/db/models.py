import datetime
import uuid
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class UserModel(Base):
    """
    User Identity & Authentication Model.
    Completely decoupled from the StudentState / Intelligence Kernel.
    Manages credentials, email, password hashes, and active sessions.
    """
    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # 1 User can map to 1 or more Student learning contexts
    students = relationship("StudentModel", back_populates="user", cascade="all, delete-orphan")

class StudentModel(Base):
    """
    Core student learning persona.
    Maps to the StudentState and Intelligence Kernel.
    """
    __tablename__ = "students"

    student_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    goal = Column(String(255), default="UPSC CSE 2027")
    target_exam_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("UserModel", back_populates="students")
    events = relationship("StudentEventModel", back_populates="student", cascade="all, delete-orphan")
    snapshots = relationship("StateSnapshotModel", back_populates="student", cascade="all, delete-orphan")
    learning_sessions = relationship("LearningSessionModel", back_populates="student", cascade="all, delete-orphan")

class StudentEventModel(Base):
    """
    Immutable Event Log (Append-Only Event Sourcing).
    Every student interaction, assessment response, and session transition is stored immutably.
    """
    __tablename__ = "student_events"

    event_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.student_id"), nullable=False, index=True)
    session_id = Column(String(36), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    source = Column(String(100), default="system")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    student = relationship("StudentModel", back_populates="events")

class StateSnapshotModel(Base):
    """
    Periodic or post-assessment snapshot of the complete 8-domain epistemic state.
    Enables instant cold-restart restores while preserving event history.
    """
    __tablename__ = "state_snapshots"

    snapshot_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.student_id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    state_json = Column(JSON, nullable=False)
    latest_event_id = Column(String(36), nullable=True)

    student = relationship("StudentModel", back_populates="snapshots")

class LearningSessionModel(Base):
    """
    Lifecycle of a guided Learning Session.
    Tracks state machine from 'initialized' -> 'teaching' -> 'practice' -> 'completed'.
    """
    __tablename__ = "learning_sessions"

    session_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.student_id"), nullable=False, index=True)
    topic = Column(String(100), nullable=False)
    subject = Column(String(100), nullable=False)
    session_type = Column(String(50), nullable=False) # "learn" | "practice" | "revise" | "investigate_probe" | "prerequisite_remediation"
    status = Column(String(50), default="active", index=True) # "active" | "completed" | "abandoned"
    current_phase = Column(String(50), default="instruction") # "instruction" | "interaction" | "assessment" | "summary"
    target_learning_objective = Column(Text, nullable=True)
    pedagogical_action = Column(String(100), nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    session_log = Column(JSON, default=list) # Audit log of dialog turns and interactions

    student = relationship("StudentModel", back_populates="learning_sessions")

class ItemCalibrationHistoryModel(Base):
    """
    Empirical calibration history for assessment questions.
    Tracks progression from AUTHOR_PRIOR -> PILOT_TESTED -> FIELD_CALIBRATED.
    """
    __tablename__ = "item_calibration_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(String(100), nullable=False, index=True)
    sample_size = Column(Integer, default=0)
    empirical_p_value = Column(Float, nullable=True)
    difficulty_estimate = Column(Float, nullable=False)
    discrimination_estimate = Column(Float, nullable=False)
    standard_error = Column(Float, nullable=False)
    validation_status = Column(String(50), nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

class IntelligenceReceiptModel(Base):
    """
    Persistent audit trail of every automated intelligence decision,
    observations, alternatives considered, constraints checked, and rationales.
    """
    __tablename__ = "intelligence_receipts"

    receipt_id = Column(String(36), primary_key=True)
    student_id = Column(String(36), nullable=True, index=True)
    decision = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    confidence = Column(Float, nullable=False)
    selection_reason = Column(Text, nullable=False)
    observations = Column(JSON, nullable=False)
    predictions = Column(JSON, nullable=False)
    candidate_actions = Column(JSON, nullable=False)
    selected_action = Column(JSON, nullable=False)
    constraints_checked = Column(JSON, nullable=False)
    assumptions = Column(JSON, nullable=False)
    unknowns = Column(JSON, nullable=False)
