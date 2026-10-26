import hashlib
import json
import uuid
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.auth import create_access_token, signing_key
from app.db.models import Base, StudentEventModel, StateSnapshotModel, IntelligenceReceiptModel, LearningProjectionModel
from app.db.repository import DatabaseRepository
from app.service import StudentService

def account(client):
    result = client.post("/auth/register", json={"email": f"{uuid.uuid4()}@test.example", "password": "TwelveChars123!", "full_name": "Learner"})
    assert result.status_code == 201, result.text
    return result.json()

@pytest.fixture
def owner():
    with TestClient(app) as client:
        auth = account(client)
        client.headers["Authorization"] = "Bearer " + auth["access_token"]
        result = client.post("/student/onboard", json={"name": "Learner", "user_id": "forged-user"})
        assert result.status_code == 201, result.text
        assert result.json()["user_id"] == auth["user_id"]
        yield client, result.json()["student_id"]

def test_signing_key_required(monkeypatch):
    monkeypatch.delenv("JWT_SECRET_KEY")
    with pytest.raises(RuntimeError):
        signing_key()

def test_unauthenticated_and_cross_account_resources(owner):
    client, student = owner
    assessment = client.post(f"/student/{student}/assess", json={"knowledge_node": "solar_insolation", "subject": "Geography", "responses": [{"question_id": "GEO_SOLAR_REC_01", "selected_option_index": 0}]})
    assert assessment.status_code == 200, assessment.text
    receipt = assessment.json()["intelligence_receipt_id"]
    session = client.post("/session/start", json={"student_id": student}).json()["session_id"]
    endpoints = [f"/student/{student}/state", f"/student/{student}/schedule", f"/receipt/{receipt}", f"/session/{session}"]
    with TestClient(app) as stranger:
        for path in endpoints:
            assert stranger.get(path).status_code == 401
        auth = account(stranger)
        stranger.headers["Authorization"] = "Bearer " + auth["access_token"]
        for path in endpoints:
            assert stranger.get(path).status_code == 404
        assert stranger.post(f"/session/{session}/complete", json={}).status_code == 404
        assert stranger.post(f"/learning/{student}/start", json={"command_id": str(uuid.uuid4())}).status_code == 404
        assert stranger.post("/session/start", json={"student_id": student}).status_code == 404

def test_complete_connected_journey_and_idempotency(owner):
    client, student = owner
    start = client.post(f"/learning/{student}/start", json={"command_id": str(uuid.uuid4())})
    assert start.status_code == 200, start.text
    view = start.json()
    assert "answer" not in view["item"]
    assert all(c["grey"] for c in view["concepts"])
    answer = {"command_id": str(uuid.uuid4()), "item_id": view["item"]["id"], "revision": view["revision"], "choice": 1, "confidence": 3, "time_sec": 15}
    result = client.post(f"/learning/{student}/answer", json=answer)
    assert result.status_code == 200, result.text
    next_view = result.json()
    assert next_view["revision"] == view["revision"] + 1
    assert next_view["feedback"]["correct"] is True
    # One answer updates evidence without prematurely claiming certainty.
    assert any(c["nEff"] > 0 for c in next_view["concepts"])
    assert next_view["concepts"] != view["concepts"]
    assert client.post(f"/learning/{student}/answer", json=answer).json() == next_view
    changed = {**answer, "choice": 0}
    assert client.post(f"/learning/{student}/answer", json=changed).status_code == 409
    stale = {**answer, "command_id": str(uuid.uuid4())}
    assert client.post(f"/learning/{student}/answer", json=stale).status_code == 409
    bad = {**answer, "command_id": str(uuid.uuid4()), "revision": next_view["revision"], "item_id": "not-issued"}
    assert client.post(f"/learning/{student}/answer", json=bad).status_code == 409
    with TestClient(app) as restarted:
        restarted.headers.update(client.headers)
        restored = restarted.post(f"/learning/{student}/start", json={"command_id": str(uuid.uuid4())}).json()
        assert restored["concepts"] == next_view["concepts"]

def isolated(tmp_path):
    engine = create_engine("sqlite:///" + str(tmp_path / "atomic.db"), connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    return factory, StudentService(db_repository=DatabaseRepository(factory))

def test_rollback_does_not_leave_events_receipts_or_state(tmp_path, monkeypatch):
    factory, service = isolated(tmp_path)
    student = service.onboard_student("Atomic")["student_id"]
    initial = service.get_student_state(student)
    def fail(*args, **kwargs):
        raise RuntimeError("Injected persistence failure")
    monkeypatch.setattr(service.db_repo, "save_state_snapshot", fail)
    with pytest.raises(RuntimeError):
        service.submit_assessment(student, "solar_insolation", "Geography", [{"question_id": "GEO_SOLAR_REC_01", "selected_option_index": 0}])
    assert service.get_student_state(student) == initial
    with factory() as session:
        assert session.query(StudentEventModel).count() == 1
        assert session.query(StateSnapshotModel).count() == 1
        assert session.query(IntelligenceReceiptModel).count() == 0

def test_separate_workers_serialize_updates_and_replay_exactly(tmp_path):
    factory, service = isolated(tmp_path)
    student = service.onboard_student("Concurrent")["student_id"]
    def assess(i):
        worker = StudentService(db_repository=DatabaseRepository(factory))
        return worker.submit_assessment(student, "solar_insolation", "Geography", [{"question_id": "GEO_SOLAR_REC_01", "selected_option_index": i % 2}], self_reported_confidence=0.8)
    with ThreadPoolExecutor(max_workers=4) as pool:
        assert len(list(pool.map(assess, range(8)))) == 8
    live = service.get_student_state(student)
    assert service.replay_events_for_student(student).full_state() == live
    with factory() as session:
        assert session.query(IntelligenceReceiptModel).count() == 8
        assert session.query(StateSnapshotModel).count() == 9

def test_missing_and_expired_tokens(owner):
    client, student = owner
    client.headers["Authorization"] = "Bearer invalid"
    assert client.get(f"/student/{student}/state").status_code == 401
    import datetime
    client.headers["Authorization"] = "Bearer " + create_access_token({"sub": "no-user"}, datetime.timedelta(seconds=-1))
    assert client.get(f"/student/{student}/state").status_code == 401

def test_auth_throttles_across_requests():
    with TestClient(app) as client:
        email = f"{uuid.uuid4()}@test.example"
        for _ in range(10):
            assert client.post("/auth/login", json={"email": email, "password": "WrongPassword123"}).status_code == 401
        blocked = client.post("/auth/login", json={"email": email, "password": "WrongPassword123"})
        assert blocked.status_code == 429
        assert blocked.headers["Retry-After"] == "600"

def test_runtime_failure_is_sanitized_and_rolls_back(owner, monkeypatch):
    client, student = owner
    def fail(*args):
        raise RuntimeError("sensitive-internal-details")
    monkeypatch.setattr("app.learning.runtime", fail)
    response = client.post(f"/learning/{student}/start", json={"command_id": str(uuid.uuid4())})
    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error"}
    assert "X-Request-ID" in response.headers
    from app.db.session import SessionLocal
    with SessionLocal() as session:
        assert session.get(LearningProjectionModel, student) is None

def test_oversize_body_rejected_before_authentication():
    with TestClient(app) as client:
        response = client.post("/auth/login", content=b"x" * 65537)
        assert response.status_code == 413

def test_inactive_account_cannot_access_existing_learning(owner):
    client, student = owner
    from app.db.session import SessionLocal
    from app.db.models import StudentModel, UserModel
    with SessionLocal() as session:
        learner = session.get(StudentModel, student)
        user = session.get(UserModel, learner.user_id)
        user.is_active = False
        session.commit()
    assert client.get(f"/student/{student}/state").status_code == 401

def test_proxy_address_is_trusted_only_when_configured(monkeypatch):
    from types import SimpleNamespace
    from app.main import client_address
    request = SimpleNamespace(client=SimpleNamespace(host="172.25.1.2"), headers={"X-Real-IP": "203.0.113.9"})
    monkeypatch.delenv("TRUSTED_PROXY_CIDRS", raising=False)
    assert client_address(request) == "172.25.1.2"
    monkeypatch.setenv("TRUSTED_PROXY_CIDRS", "172.25.0.0/16")
    assert client_address(request) == "203.0.113.9"

def test_rapid_correct_guess_does_not_create_false_mastery(owner):
    client, student = owner
    view = client.post(f"/learning/{student}/start", json={"command_id": str(uuid.uuid4())}).json()
    response = client.post(f"/learning/{student}/answer", json={"command_id": str(uuid.uuid4()), "revision": view["revision"], "item_id": view["item"]["id"], "choice": 1, "confidence": 2, "time_sec": 0.1})
    assert response.status_code == 200, response.text
    assert response.json()["feedback"]["correct"] is True
    assert all(c["nEff"] == 0 for c in response.json()["concepts"])

def test_polity_teaching_and_observed_cognitive_loop(owner):
    client, _ = owner
    student = client.post("/student/onboard", json={"name": "Polity learner", "goal": "UPSC Polity"}).json()["student_id"]
    view = client.post(f"/learning/{student}/start", json={"command_id": str(uuid.uuid4())}).json()
    assert view["content_version"].startswith("polity")
    for _ in range(3):
        for _step in range(20):
            if view["session"]["status"] == "completed":
                view = client.post(f"/learning/{student}/start", json={"command_id": str(uuid.uuid4())}).json()
            if view["lesson"]["input"] == "item_response":
                break
            response = client.post(f"/learning/{student}/action", json={"command_id": str(uuid.uuid4()), "revision": view["revision"], "step_id": view["lesson"]["step_id"], "action": "continue"})
            assert response.status_code == 200, response.text
            view = response.json()
        result = client.post(f"/learning/{student}/answer", json={"command_id": str(uuid.uuid4()), "revision": view["revision"], "item_id": view["item"]["id"], "choice": 0, "confidence": 3, "time_sec": 10})
        assert result.status_code == 200, result.text
        view = result.json()
        assert view["feedback"]["explanation"] is not None
    assert view["self_model"]["evidence"].startswith("observed")
    assert "runtime_context" not in view

@pytest.mark.skipif(not __import__("os").environ.get("TEST_DATABASE_URL"), reason="PostgreSQL integration runs in CI")
def test_postgres_workers_preserve_all_learning_updates():
    import os
    engine = create_engine(os.environ["TEST_DATABASE_URL"])
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    service = StudentService(db_repository=DatabaseRepository(factory))
    student = service.onboard_student("Postgres concurrent learner")["student_id"]
    def assess(i):
        worker = StudentService(db_repository=DatabaseRepository(factory))
        worker.submit_assessment(student, "solar_insolation", "Geography", [{"question_id": "GEO_SOLAR_REC_01", "selected_option_index": i % 2}])
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(assess, range(8)))
    assert service.replay_events_for_student(student).full_state() == service.get_student_state(student)
    with factory() as session:
        assert session.query(IntelligenceReceiptModel).filter_by(student_id=student).count() == 8
    engine.dispose()
