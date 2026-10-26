"""
FastAPI Application Interface for Techgram / Astra Edu.
======================================================
Strict Adapter Boundary:
Translates HTTP Requests -> Domain Commands -> Kernel Execution -> JSON Response.
Contains ZERO pedagogical or scheduling logic.
"""

from fastapi import FastAPI, HTTPException, status, Depends, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
import logging
import uuid
import os
import time
from .auth import decode_access_token, signing_key
from .db.session import init_db, engine, SessionLocal
from .db.repository import DatabaseRepository
from .db.models import IntelligenceReceiptModel
from .learning import learning_command, current_learning, runtime, LearningConflict
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Dict, Any, Literal

from app.service import StudentService

@asynccontextmanager
async def lifespan(app):
    signing_key()
    if os.environ.get("APP_ENV") == "production":
        if engine.dialect.name != "postgresql":
            raise RuntimeError("Production requires PostgreSQL")
        from sqlalchemy import inspect
        if not inspect(engine).has_table("learning_projections"):
            raise RuntimeError("Run database migrations before starting the API")
        with engine.connect() as connection:
            revision = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
        if revision != "0002_learning_journey":
            raise RuntimeError("Database schema revision is not supported by this release")
        from .learning import ROOT
        if not (ROOT / "runtime" / "learning.mjs").is_file():
            raise RuntimeError("The compiled learning runtime is missing")
    else:
        init_db()
    yield

app = FastAPI(
    lifespan=lifespan,
    title="Techgram / Astra Edu Student Intelligence Engine",
    description="Closed-loop epistemic learner modeling, assessment, and intervention scheduling API.",
    version="1.0.0"
)

def get_service():
    # A session and service per request. No cross-worker hot cache.
    with SessionLocal() as session:
        yield StudentService(db_repository=DatabaseRepository(session))

bearer = HTTPBearer(auto_error=False)

def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer),
                 service: StudentService = Depends(get_service)):
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Authentication required", headers={"WWW-Authenticate": "Bearer"})
    try:
        claims = decode_access_token(credentials.credentials)
        user = service.db_repo.get_user_by_id(claims["sub"])
        if not user or not user.is_active:
            raise ValueError("Inactive account")
        return user.user_id
    except Exception:
        raise HTTPException(401, "Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})

def require_student(student_id, user_id, service):
    student = service.db_repo.get_student(str(student_id))
    if not student or student.user_id != user_id:
        raise HTTPException(404, "Student not found")

def protected_resource(request: Request, user_id: str = Depends(current_user),
                       service: StudentService = Depends(get_service)):
    if os.environ.get("APP_ENV") == "production" and (
        request.url.path.startswith(("/session", "/receipt")) or
        (request.url.path.startswith("/student/") and request.url.path != "/student/onboard")
    ):
        raise HTTPException(410, "Use the authoritative /learning API in production")
    params = request.path_params
    if "student_id" in params:
        require_student(params["student_id"], user_id, service)
    elif "session_id" in params:
        session = service.get_learning_session(str(params["session_id"]))
        if not session:
            raise HTTPException(404, "Session not found")
        require_student(session["student_id"], user_id, service)
    elif "receipt_id" in params:
        receipt = service.db_repo._direct_session.get(IntelligenceReceiptModel, str(params["receipt_id"]))
        if not receipt or not receipt.student_id:
            raise HTTPException(404, "Receipt not found")
        require_student(receipt.student_id, user_id, service)
    return user_id

@app.middleware("http")
async def request_metadata(request: Request, call_next):
    request_id = str(uuid.uuid4())
    began = time.monotonic()
    from fastapi.responses import JSONResponse
    try:
        if int(request.headers.get("content-length", "0")) > 65536:
            return JSONResponse(status_code=413, content={"detail": "Request body too large"})
    except ValueError:
        return JSONResponse(status_code=400, content={"detail": "Invalid content length"})
    if request.method in ("POST", "PUT", "PATCH"):
        chunks, size = [], 0
        async for chunk in request.stream():
            size += len(chunk)
            if size > 65536:
                return JSONResponse(status_code=413, content={"detail": "Request body too large"})
            chunks.append(chunk)
        request._body = b"".join(chunks)
    try:
        response = await call_next(request)
    except Exception as exc:
        logging.getLogger("techgram.api").error("request_id=%s error_type=%s", request_id, type(exc).__name__)
        response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    logging.getLogger("techgram.access").info("request_id=%s method=%s status=%s duration_ms=%.1f",
        request_id, request.method, response.status_code, (time.monotonic() - began) * 1000)
    return response

async def auth_rate_limit(request: Request):
    from starlette.concurrency import run_in_threadpool
    from .rate_limit import check_auth_rate
    try:
        body = await request.json()
    except ValueError:
        raise HTTPException(400, "Invalid JSON")
    email = body.get("email", "") if isinstance(body, dict) else ""
    if not isinstance(email, str):
        email = ""
    blocked = await run_in_threadpool(check_auth_rate, client_address(request), email)
    if blocked:
        raise HTTPException(429, "Too many authentication attempts", headers={"Retry-After": "600"})

def client_address(request):
    """Only an explicitly trusted reverse proxy can supply the client address."""
    import ipaddress
    peer = request.client.host if request.client else "unknown"
    try:
        trusted = [ipaddress.ip_network(c.strip()) for c in os.environ.get("TRUSTED_PROXY_CIDRS", "").split(",") if c.strip()]
        if any(ipaddress.ip_address(peer) in network for network in trusted):
            return str(ipaddress.ip_address(request.headers.get("X-Real-IP", peer)))
    except ValueError:
        pass
    return peer

@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    from fastapi.responses import JSONResponse
    logging.getLogger("techgram.api").error("Unhandled API error type=%s", type(exc).__name__)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# -------------------------------------------------------------
# Request & Response Schemas
# -------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$", description="User unique email address")
    password: str = Field(..., min_length=12, max_length=128, description="Password (min 12 chars)")
    full_name: str = Field(..., min_length=1, max_length=255, description="Full legal or display name")

class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255, description="User email address")
    password: str = Field(..., max_length=128, description="User password")

class AuthTokenResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    access_token: str
    token_type: str

class OnboardRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Student legal or display name")
    goal: str = Field(default="UPSC CSE 2027", max_length=255, description="Target competitive examination or syllabus")
    target_exam_date: Optional[str] = Field(default=None, description="ISO format date (YYYY-MM-DD)")
    user_id: Optional[str] = Field(default=None, description="Optional bound user identity ID")

    @field_validator("target_exam_date")
    @classmethod
    def validate_date(cls, value):
        if value is not None:
            from datetime import date
            return date.fromisoformat(value).isoformat()
        return value

class OnboardResponse(BaseModel):
    student_id: uuid.UUID
    user_id: Optional[str] = None
    name: str
    goal: str
    status: str
    onboarded_at: str

class ItemResponseSubmission(BaseModel):
    question_id: str
    selected_option_index: Optional[int] = Field(default=None, ge=0, le=20, strict=True)

class AssessRequest(BaseModel):
    knowledge_node: str = Field(..., description="Target concept ID in curriculum DAG")
    subject: str = Field(..., description="Curriculum domain, e.g., Geography, Polity")
    responses: List[ItemResponseSubmission] = Field(..., min_length=1, max_length=100, description="List of submitted item responses")
    self_reported_confidence: Optional[float] = Field(
        default=None, ge=0.0, le=1.0,
        description="Optional subjective confidence report [0.0 to 1.0]"
    )

class AssessResponse(BaseModel):
    session_id: uuid.UUID
    student_id: uuid.UUID
    topic: str
    items_administered: int
    correct_count: int
    irt_ability: float
    irt_se: float
    bkt_mastery: float
    reconciled_vector: Dict[str, Any]
    root_cause_diagnosis: Optional[Dict[str, Any]]
    intelligence_receipt_id: uuid.UUID

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
    student_id: uuid.UUID = Field(..., description="Target student UUID")
    topic: Optional[str] = Field(default=None, description="Optional target topic; defaults to kernel scheduler recommendation")
    subject: Optional[str] = Field(default=None, description="Optional subject domain")

class SessionInteractRequest(BaseModel):
    turn_role: Literal["student"] = Field(..., description="'student' or 'teacher'")
    content: str = Field(..., min_length=1, max_length=10000, description="Message text or interaction content")
    next_phase: Optional[Literal["instruction", "interaction", "assessment", "summary"]] = Field(default=None, description="Optional phase transition ('instruction', 'interaction', 'assessment', 'summary')")

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
        "llm_dependency": False,
        "authoritative_engine": "typescript-kernel-v1",
    }

@app.post("/auth/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"], dependencies=[Depends(auth_rate_limit)])
def register_user(req: UserRegisterRequest, service: StudentService = Depends(get_service)):
    """Register a new user identity account."""
    try:
        return service.register_user(email=req.email, password=req.password, full_name=req.full_name)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(409, "Conflicting resource")

@app.post("/auth/login", response_model=AuthTokenResponse, tags=["Authentication"], dependencies=[Depends(auth_rate_limit)])
def login_user(req: UserLoginRequest, service: StudentService = Depends(get_service)):
    """Authenticate user credentials and obtain JWT access token."""
    try:
        return service.authenticate_user(email=req.email, password=req.password)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(ve))
    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(409, "Conflicting resource")

@app.post("/student/onboard", response_model=OnboardResponse, status_code=status.HTTP_201_CREATED, tags=["Student"], dependencies=[Depends(protected_resource)])
def onboard_student(req: OnboardRequest, user_id: str = Depends(current_user), service: StudentService = Depends(get_service)):
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
            user_id=user_id
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.post("/student/{student_id}/assess", response_model=AssessResponse, tags=["Assessment"], dependencies=[Depends(protected_resource)])
def submit_assessment(student_id: uuid.UUID, req: AssessRequest, service: StudentService = Depends(get_service)):
    """
    Submit assessment responses to the closed-loop evaluation pipeline.
    Executes IRT scoring, BKT knowledge updating, State Reconciliation,
    Prerequisite Bottleneck Diagnosis, and emits an auditable Intelligence Receipt.
    """
    student_id = str(student_id)
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
    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(409, "Conflicting resource")

@app.get("/student/{student_id}/state", tags=["Student"], dependencies=[Depends(protected_resource)])
def get_student_state(student_id: uuid.UUID, service: StudentService = Depends(get_service)):
    """
    Retrieve the complete 8-domain epistemic StudentState, including multi-dimensional
    LearningStateVectors and competing hypothesis belief distributions.
    """
    student_id = str(student_id)
    state = service.get_student_state(student_id)
    if not state:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student '{student_id}' not found")
    return state

@app.get("/student/{student_id}/schedule", response_model=List[SessionBlockResponse], tags=["Intervention"], dependencies=[Depends(protected_resource)])
def get_student_schedule(student_id: uuid.UUID, n_blocks: int = Query(5, ge=1, le=20), duration_min: int = Query(40, ge=1, le=180), service: StudentService = Depends(get_service)):
    """
    Retrieve the next deterministic intervention schedule.
    Automatically prioritizes investigation probes when uncertainty is elevated,
    and reroutes to root-cause prerequisite remediation when ancestor deficits are isolated.
    """
    student_id = str(student_id)
    schedule = service.get_schedule(student_id, n_blocks=n_blocks, block_duration=duration_min)
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student '{student_id}' not found")
    return schedule

@app.get("/receipt/{receipt_id}", tags=["Audit & Transparency"], dependencies=[Depends(protected_resource)])
def get_intelligence_receipt(receipt_id: uuid.UUID, service: StudentService = Depends(get_service)):
    """
    Retrieve an auditable decision receipt demonstrating complete observations,
    predictions, candidate alternatives, and mathematical rationales.
    """
    receipt_id = str(receipt_id)
    receipt = service.get_receipt(receipt_id)
    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Intelligence Receipt '{receipt_id}' not found")
    return receipt

# -------------------------------------------------------------
# Learning Session Endpoints
# -------------------------------------------------------------

@app.post("/session/start", tags=["Session"], dependencies=[Depends(protected_resource)])
def start_learning_session(req: SessionStartRequest, user_id: str = Depends(current_user), service: StudentService = Depends(get_service)):
    """
    Initialize a structured learning session based on the student's current epistemic state
    and deterministic kernel scheduling. Emits a TeachingBrief to guide instructional execution.
    """
    require_student(req.student_id, user_id, service)
    session = service.start_learning_session(
        student_id=str(req.student_id),
        topic=req.topic,
        subject=req.subject
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student '{req.student_id}' not found")
    return session

@app.post("/session/{session_id}/interact", tags=["Session"], dependencies=[Depends(protected_resource)])
def record_session_turn(session_id: uuid.UUID, req: SessionInteractRequest, service: StudentService = Depends(get_service)):
    """
    Record an instructional or student dialogue turn and optionally advance the phase.
    """
    session_id = str(session_id)
    result = service.record_session_interaction(
        session_id=session_id,
        turn_role=req.turn_role,
        content=req.content,
        next_phase=req.next_phase
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Active session '{session_id}' not found")
    return result

@app.post("/session/{session_id}/complete", tags=["Session"], dependencies=[Depends(protected_resource)])
def complete_session(session_id: uuid.UUID, req: SessionCompleteRequest, service: StudentService = Depends(get_service)):
    """
    Complete an active learning session and record closure metrics in persistent storage.
    """
    session_id = str(session_id)
    result = service.complete_learning_session(
        session_id=session_id,
        summary=req.summary
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Active session '{session_id}' not found")
    return result

@app.get("/session/{session_id}", tags=["Session"], dependencies=[Depends(protected_resource)])
def get_session_details(session_id: uuid.UUID, service: StudentService = Depends(get_service)):
    """
    Retrieve complete session details and dialogue interaction log.
    """
    session_id = str(session_id)
    session_data = service.get_learning_session(session_id)
    if not session_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session '{session_id}' not found")
    return session_data


@app.get("/ready", tags=["System"])
def readiness():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ready"}

@app.get("/student/{student_id}/items", dependencies=[Depends(protected_resource)])
def next_items(student_id: uuid.UUID, knowledge_node: str, n: int = Query(3, ge=1, le=10),
               service: StudentService = Depends(get_service)):
    state = service._get_or_load_state(str(student_id))
    items = service.pipeline.select_next_assessment_items(state, knowledge_node, n_items=n)
    return [{"question_id": q.question_id, "text": q.text, "options": q.options,
             "knowledge_node": q.knowledge_node, "dimension": q.cognitive_dimension.value,
             "calibration": q.validation_status.value} for q in items]

class LearningStartRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    command_id: uuid.UUID
    minutes: int = Field(default=20, ge=5, le=120)

class LearningAnswerRequest(LearningStartRequest):
    revision: int = Field(ge=1)
    item_id: str = Field(min_length=1, max_length=100)
    choice: int = Field(ge=0, le=3, strict=True)
    confidence: int = Field(default=2, ge=1, le=3, strict=True)
    time_sec: float = Field(ge=0.1, le=7200, allow_inf_nan=False)

class LearningActionRequest(LearningStartRequest):
    revision: int = Field(ge=1)
    step_id: str = Field(min_length=1, max_length=100)
    action: Literal["continue", "hint", "example", "pause", "resume", "finish"]
    elapsed_sec: float = Field(default=0, ge=0, le=300, allow_inf_nan=False)

class LearningPreferencesRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    command_id: uuid.UUID
    revision: int = Field(ge=0)
    level: Literal["School", "Graduation", "Postgraduation", "Working professional"] = "Graduation"
    style: Literal["Give me another explanation", "Let me try it myself", "Show me an example", "Help me understand why it matters first"] = "Show me an example"
    energy: Literal["Low", "Okay", "High"] = "Okay"
    language: Literal["English", "Hinglish"] = "English"
    humor: bool = False
    geographyUnit: Literal["geomorphology", "maps_motions", "atmosphere", "monsoon"] = "geomorphology"
    minutes: int = Field(default=40, ge=5, le=120)
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    examDate: str = Field(default="", max_length=10)

    @field_validator("examDate")
    @classmethod
    def validate_exam_date(cls, value):
        if value:
            from datetime import date
            date.fromisoformat(value)
        return value

class LearningReflectionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    command_id: uuid.UUID
    revision: int = Field(ge=1)
    session_id: uuid.UUID
    feeling: str = Field(default="", max_length=500)
    next: str = Field(default="", max_length=500)

@app.get("/learning/{student_id}", dependencies=[Depends(protected_resource)])
def get_connected_learning(student_id: uuid.UUID, service: StudentService = Depends(get_service)):
    return current_learning(service, str(student_id))

@app.post("/learning/{student_id}/preferences", dependencies=[Depends(protected_resource)])
def save_connected_preferences(student_id: uuid.UUID, req: LearningPreferencesRequest, service: StudentService = Depends(get_service)):
    try:
        return learning_command(service, str(student_id), str(req.command_id), preferences=req.model_dump(exclude={"command_id"}))
    except LearningConflict as exc:
        raise HTTPException(409, str(exc))

@app.post("/learning/{student_id}/action", dependencies=[Depends(protected_resource)])
def act_connected_learning(student_id: uuid.UUID, req: LearningActionRequest, service: StudentService = Depends(get_service)):
    try:
        return learning_command(service, str(student_id), str(req.command_id), minutes=req.minutes, action=req.model_dump(exclude={"command_id", "minutes"}))
    except LearningConflict as exc:
        raise HTTPException(409, str(exc))

@app.post("/learning/{student_id}/reflection", dependencies=[Depends(protected_resource)])
def save_connected_reflection(student_id: uuid.UUID, req: LearningReflectionRequest, service: StudentService = Depends(get_service)):
    try:
        data = req.model_dump(exclude={"command_id"})
        data["session_id"] = str(req.session_id)
        return learning_command(service, str(student_id), str(req.command_id), reflection=data)
    except LearningConflict as exc:
        raise HTTPException(409, str(exc))

@app.get("/learning/{student_id}/knowledge", dependencies=[Depends(protected_resource)])
def search_connected_knowledge(student_id: uuid.UUID, q: str = Query(min_length=3, max_length=300), service: StudentService = Depends(get_service)):
    student = service.db_repo.get_student(str(student_id))
    return runtime({"operation": "knowledge", "query": q, "pack": "polity" if student.goal == "UPSC Polity" else "geography"})

@app.post("/learning/{student_id}/start", dependencies=[Depends(protected_resource)])
def start_connected_learning(student_id: uuid.UUID, req: LearningStartRequest,
                             service: StudentService = Depends(get_service)):
    try:
        return learning_command(service, str(student_id), str(req.command_id), minutes=req.minutes)
    except LearningConflict as exc:
        raise HTTPException(409, str(exc))

@app.post("/learning/{student_id}/answer", dependencies=[Depends(protected_resource)])
def answer_connected_learning(student_id: uuid.UUID, req: LearningAnswerRequest,
                              service: StudentService = Depends(get_service)):
    try:
        answer = req.model_dump(exclude={"command_id", "minutes"})
        return learning_command(service, str(student_id), str(req.command_id), answer, req.minutes)
    except LearningConflict as exc:
        raise HTTPException(409, str(exc))

@app.get("/students", dependencies=[Depends(current_user)])
def list_my_students(user_id: str = Depends(current_user), service: StudentService = Depends(get_service)):
    from .db.models import StudentModel
    return [{"student_id": s.student_id, "name": s.name, "goal": s.goal}
            for s in service.db_repo._direct_session.query(StudentModel).filter_by(user_id=user_id).all()]
