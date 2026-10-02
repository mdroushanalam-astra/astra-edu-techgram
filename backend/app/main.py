"""
FastAPI Application Interface for Techgram / Astra Edu.
======================================================
Strict Adapter Boundary:
Translates HTTP Requests -> Domain Commands -> Kernel Execution -> JSON Response.
Contains ZERO pedagogical or scheduling logic.
"""

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from app.service import StudentService

app = FastAPI(
    title="Techgram / Astra Edu Student Intelligence Engine",
    description="Closed-loop epistemic learner modeling, assessment, and intervention scheduling API.",
    version="1.0.0"
)

# Global Service Singleton for API layer
service = StudentService()

# -------------------------------------------------------------
# Request & Response Schemas
# -------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="User unique email address")
    password: str = Field(..., min_length=6, description="Password (min 6 chars)")
    full_name: str = Field(..., description="Full legal or display name")

class UserLoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class AuthTokenResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    access_token: str
    token_type: str

class OnboardRequest(BaseModel):
    name: str = Field(..., description="Student legal or display name")
    goal: str = Field(default="UPSC CSE 2027", description="Target competitive examination or syllabus")
    target_exam_date: Optional[str] = Field(default=None, description="ISO format date (YYYY-MM-DD)")
    user_id: Optional[str] = Field(default=None, description="Optional bound user identity ID")

class OnboardResponse(BaseModel):
    student_id: str
    user_id: Optional[str] = None
    name: str
    goal: str
    status: str
    onboarded_at: str

class ItemResponseSubmission(BaseModel):
    question_id: str
    selected_option_index: Optional[int] = None

class AssessRequest(BaseModel):
    knowledge_node: str = Field(..., description="Target concept ID in curriculum DAG")
    subject: str = Field(..., description="Curriculum domain, e.g., Geography, Polity")
    responses: List[ItemResponseSubmission] = Field(..., description="List of submitted item responses")
    self_reported_confidence: Optional[float] = Field(
        default=None, ge=0.0, le=1.0,
        description="Optional subjective confidence report [0.0 to 1.0]"
    )

class AssessResponse(BaseModel):
    session_id: str
    student_id: str
    topic: str
    items_administered: int
    correct_count: int
    irt_ability: float
    irt_se: float
    bkt_mastery: float
    reconciled_vector: Dict[str, Any]
    root_cause_diagnosis: Optional[Dict[str, Any]]
    intelligence_receipt_id: str

class SessionBlockResponse(BaseModel):
    topic: str
    subject: str
    session_type: str
    duration_min: int
    difficulty: float
    reason: str
    priority_score: float
    probe_type: Optional[str] = None
    root_cause_target: Optional[str] = None

class SessionStartRequest(BaseModel):
    student_id: str = Field(..., description="Target student UUID")
    topic: Optional[str] = Field(default=None, description="Optional target topic; defaults to kernel scheduler recommendation")
    subject: Optional[str] = Field(default=None, description="Optional subject domain")

class SessionInteractRequest(BaseModel):
    turn_role: str = Field(..., description="'student' or 'teacher'")
    content: str = Field(..., description="Message text or interaction content")
    next_phase: Optional[str] = Field(default=None, description="Optional phase transition ('instruction', 'interaction', 'assessment', 'summary')")

class SessionCompleteRequest(BaseModel):
    summary: Optional[str] = Field(default=None, description="Optional learning session summary")


# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint confirming kernel status."""
    return {
        "status": "healthy",
        "kernel": "epistemic_intelligence_kernel_v1",
        "llm_dependency": False
    }

@app.post("/auth/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
def register_user(req: UserRegisterRequest):
    """Register a new user identity account."""
    try:
        return service.register_user(email=req.email, password=req.password, full_name=req.full_name)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/auth/login", response_model=AuthTokenResponse, tags=["Authentication"])
def login_user(req: UserLoginRequest):
    """Authenticate user credentials and obtain JWT access token."""
    try:
        return service.authenticate_user(email=req.email, password=req.password)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/student/onboard", response_model=OnboardResponse, status_code=status.HTTP_201_CREATED, tags=["Student"])
def onboard_student(req: OnboardRequest):
    """
    Onboard a learner persona into the Techgram OS.
    Can optionally bind to an authenticated User identity (req.user_id).
    Initializes a new StudentState, baseline belief distributions, and registers goal events.
    """
    try:
        return service.onboard_student(
            name=req.name,
            goal=req.goal,
            target_exam_date=req.target_exam_date,
            user_id=req.user_id
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.post("/student/{student_id}/assess", response_model=AssessResponse, tags=["Assessment"])
def submit_assessment(student_id: str, req: AssessRequest):
    """
    Submit assessment responses to the closed-loop evaluation pipeline.
    Executes IRT scoring, BKT knowledge updating, State Reconciliation,
    Prerequisite Bottleneck Diagnosis, and emits an auditable Intelligence Receipt.
    """
    try:
        raw_responses = [r.model_dump() for r in req.responses]
        result = service.submit_assessment(
            student_id=student_id,
            knowledge_node=req.knowledge_node,
            subject=req.subject,
            responses=raw_responses,
            self_reported_confidence=req.self_reported_confidence
        )
        if result is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student '{student_id}' not found")
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.get("/student/{student_id}/state", tags=["Student"])
def get_student_state(student_id: str):
    """
    Retrieve the complete 8-domain epistemic StudentState, including multi-dimensional
    LearningStateVectors and competing hypothesis belief distributions.
    """
    state = service.get_student_state(student_id)
    if not state:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student '{student_id}' not found")
    return state

@app.get("/student/{student_id}/schedule", response_model=List[SessionBlockResponse], tags=["Intervention"])
def get_student_schedule(student_id: str, n_blocks: int = 5, duration_min: int = 40):
    """
    Retrieve the next deterministic intervention schedule.
    Automatically prioritizes investigation probes when uncertainty is elevated,
    and reroutes to root-cause prerequisite remediation when ancestor deficits are isolated.
    """
    schedule = service.get_schedule(student_id, n_blocks=n_blocks, block_duration=duration_min)
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student '{student_id}' not found")
    return schedule

@app.get("/receipt/{receipt_id}", tags=["Audit & Transparency"])
def get_intelligence_receipt(receipt_id: str):
    """
    Retrieve an auditable decision receipt demonstrating complete observations,
    predictions, candidate alternatives, and mathematical rationales.
    """
    receipt = service.get_receipt(receipt_id)
    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Intelligence Receipt '{receipt_id}' not found")
    return receipt

# -------------------------------------------------------------
# Learning Session Endpoints
# -------------------------------------------------------------

@app.post("/session/start", tags=["Session"])
def start_learning_session(req: SessionStartRequest):
    """
    Initialize a structured learning session based on the student's current epistemic state
    and deterministic kernel scheduling. Emits a TeachingBrief to guide instructional execution.
    """
    session = service.start_learning_session(
        student_id=req.student_id,
        topic=req.topic,
        subject=req.subject
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student '{req.student_id}' not found")
    return session

@app.post("/session/{session_id}/interact", tags=["Session"])
def record_session_turn(session_id: str, req: SessionInteractRequest):
    """
    Record an instructional or student dialogue turn and optionally advance the phase.
    """
    result = service.record_session_interaction(
        session_id=session_id,
        turn_role=req.turn_role,
        content=req.content,
        next_phase=req.next_phase
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Active session '{session_id}' not found")
    return result

@app.post("/session/{session_id}/complete", tags=["Session"])
def complete_session(session_id: str, req: SessionCompleteRequest):
    """
    Complete an active learning session and record closure metrics in persistent storage.
    """
    result = service.complete_learning_session(
        session_id=session_id,
        summary=req.summary
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Active session '{session_id}' not found")
    return result

@app.get("/session/{session_id}", tags=["Session"])
def get_session_details(session_id: str):
    """
    Retrieve complete session details and dialogue interaction log.
    """
    session_data = service.get_learning_session(session_id)
    if not session_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session '{session_id}' not found")
    return session_data

