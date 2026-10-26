import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import LearningProjectionModel
def account(client):
    result = client.post("/auth/register", json={"email": f"{uuid.uuid4()}@test.example", "password": "TwelveChars123!", "full_name": "Learner"})
    assert result.status_code == 201, result.text
    return result.json()

@pytest.fixture
def owner():
    with TestClient(app) as client:
        auth = account(client)
        client.headers["Authorization"] = "Bearer " + auth["access_token"]
        response = client.post("/student/onboard", json={"name": "Learner"})
        assert response.status_code == 201, response.text
        yield client, response.json()["student_id"]

def command():
    return str(uuid.uuid4())

def act(client, student, view, action, **extra):
    response = client.post(f"/learning/{student}/action", json={"command_id": command(), "revision": view["revision"], "step_id": view["lesson"]["step_id"], "action": action, **extra})
    assert response.status_code == 200, response.text
    return response.json()

def test_preferences_are_owned_persistent_idempotent_and_validated(owner):
    client, student = owner
    state = client.get(f"/learning/{student}").json()
    assert state == {"revision": 0, "preferences": {}, "history": [], "view": None}
    data = {"command_id": command(), "revision": 0, "style": "Let me try it myself", "minutes": 20, "humor": True, "name": "Updated learner", "examDate": "2027-05-01"}
    saved = client.post(f"/learning/{student}/preferences", json=data)
    assert saved.status_code == 200, saved.text
    assert saved.json()["preferences"]["style"] == data["style"]
    assert client.post(f"/learning/{student}/preferences", json=data).json() == saved.json()
    assert client.post(f"/learning/{student}/preferences", json={**data, "command_id": command()}).status_code == 409
    assert client.post(f"/learning/{student}/preferences", json={**data, "revision": 1, "language": "invented"}).status_code == 422
    assert client.post(f"/learning/{student}/preferences", json={**data, "revision": 1, "examDate": "not-a-date"}).status_code == 422
    with TestClient(app) as restarted:
        restarted.headers.update(client.headers)
        assert restarted.get(f"/learning/{student}").json() == saved.json()
        assert restarted.get("/students").json()[0]["name"] == "Updated learner"
    with TestClient(app) as stranger:
        assert stranger.get(f"/learning/{student}").status_code == 401
        auth = account(stranger)
        stranger.headers["Authorization"] = "Bearer " + auth["access_token"]
        for path in [f"/learning/{student}", f"/learning/{student}/knowledge?q=sediment"]:
            assert stranger.get(path).status_code == 404
        assert stranger.post(f"/learning/{student}/preferences", json=data).status_code == 404

def test_pause_resume_restart_and_stale_step_contract(owner):
    client, student = owner
    view = client.post(f"/learning/{student}/start", json={"command_id": command(), "minutes": 40}).json()
    assert view["lesson"]["input"] == "item_response"
    original = view["lesson"]["step_id"]
    pause_data = {"command_id": command(), "revision": view["revision"], "step_id": original, "action": "pause", "elapsed_sec": 12}
    paused = client.post(f"/learning/{student}/action", json=pause_data).json()
    assert paused["session"]["status"] == "paused"
    assert paused["session"]["elapsed_sec"] == 12
    assert client.post(f"/learning/{student}/action", json=pause_data).json() == paused
    forbidden = {"command_id": command(), "revision": paused["revision"], "item_id": paused["item"]["id"], "choice": 1, "time_sec": 15}
    assert client.post(f"/learning/{student}/answer", json=forbidden).status_code == 409
    with TestClient(app) as restarted:
        restarted.headers.update(client.headers)
        restored = restarted.get(f"/learning/{student}").json()["view"]
        resumed = act(restarted, student, restored, "resume")
        assert resumed["lesson"]["step_id"] == original
        assert resumed["item"] == view["item"]
    stale = {**pause_data, "command_id": command()}
    assert client.post(f"/learning/{student}/action", json=stale).status_code == 409
    current = client.get(f"/learning/{student}").json()["view"]
    assert client.post(f"/learning/{student}/action", json={**pause_data, "command_id": command(), "revision": current["revision"], "step_id": "old-step"}).status_code == 409

def test_notes_and_reflections_survive_another_client(owner):
    client, student = owner
    view = client.post(f"/learning/{student}/start", json={"command_id": command()}).json()
    answer = client.post(f"/learning/{student}/answer", json={"command_id": command(), "revision": view["revision"], "item_id": view["item"]["id"], "choice": 1, "confidence": 2, "time_sec": 20}).json()
    completed = act(client, student, answer, "finish")
    state = client.get(f"/learning/{student}").json()
    assert len(state["history"]) == 1
    assert len(state["history"][0]["results"]) == 1
    data = {"command_id": command(), "revision": completed["revision"], "session_id": completed["session"]["id"], "feeling": "A useful example", "next": "Review later"}
    saved = client.post(f"/learning/{student}/reflection", json=data)
    assert saved.status_code == 200, saved.text
    assert client.post(f"/learning/{student}/reflection", json=data).json() == saved.json()
    with TestClient(app) as restarted:
        restarted.headers.update(client.headers)
        history = restarted.get(f"/learning/{student}").json()["history"]
        assert history[0]["feeling"] == "A useful example"
        assert history[0]["next"] == "Review later"
    new = client.post(f"/learning/{student}/start", json={"command_id": command()}).json()
    assert new["session"]["id"] != completed["session"]["id"]

def test_assisted_answer_keeps_independent_evidence_unchanged(owner):
    client, student = owner
    view = client.post(f"/learning/{student}/start", json={"command_id": command(), "minutes": 40}).json()
    # Drive the actual teacher into assisted practice, not a mocked projection.
    for _ in range(50):
        if view["lesson"]["input"] == "item_response" and view["lesson"]["hints_allowed"]:
            break
        if view["lesson"]["input"] != "item_response":
            view = act(client, student, view, "continue")
        else:
            response = client.post(f"/learning/{student}/answer", json={"command_id": command(), "revision": view["revision"], "item_id": view["item"]["id"], "choice": 0, "confidence": 2, "time_sec": 20})
            assert response.status_code == 200, response.text
            view = response.json()
    assert view["lesson"]["hints_allowed"]
    support = act(client, student, view, "hint")
    assert support["lesson"]["support"]["body"]
    evidence = [c["nEff"] for c in support["concepts"]]
    with SessionLocal() as session:
        expected = session.get(LearningProjectionModel, student).runtime_context["move"]["item"]["answer"]
    response = client.post(f"/learning/{student}/answer", json={"command_id": command(), "revision": support["revision"], "item_id": support["item"]["id"], "choice": expected, "confidence": 3, "time_sec": 20})
    assert response.status_code == 200, response.text
    answered = response.json()
    assert answered["feedback"]["assisted"] is True
    assert [c["nEff"] for c in answered["concepts"]] == evidence
    assert answered["session"]["assisted_answers"] >= 1

def test_local_knowledge_is_bounded_and_does_not_return_keys(owner):
    client, student = owner
    result = client.get(f"/learning/{student}/knowledge?q=sediment deposition")
    assert result.status_code == 200, result.text
    assert 0 < len(result.json()["results"]) <= 5
    assert "pending" in result.json()["scope"]
    assert '"answer"' not in result.text
    assert client.get(f"/learning/{student}/knowledge?q=x").status_code == 422

def test_new_geography_units_are_owned_persistent_and_independent(owner):
    client, student = owner
    prefs = client.post(f"/learning/{student}/preferences", json={"command_id": command(), "revision": 0, "geographyUnit": "monsoon"})
    assert prefs.status_code == 200, prefs.text
    assert prefs.json()["preferences"]["geographyUnit"] == "monsoon"
    view = client.post(f"/learning/{student}/start", json={"command_id": command(), "minutes": 40}).json()
    assert view["content_version"].startswith("geography-units-1-")
    assert view["lesson"]["concept_id"] == "gu_coordinates"
    assert view["teaching"] is None
    assert "answer" not in view["item"]
    assert "nodes" not in view["lesson"]["board"]
    assert view["lesson"]["hints_allowed"] is False
    denied = client.post(f"/learning/{student}/action", json={"command_id": command(), "revision": view["revision"], "step_id": view["lesson"]["step_id"], "action": "hint"})
    assert denied.status_code == 409
    with SessionLocal() as session:
        correct = session.get(LearningProjectionModel, student).runtime_context["move"]["item"]["answer"]
    response = client.post(f"/learning/{student}/answer", json={"command_id": command(), "revision": view["revision"], "item_id": view["item"]["id"], "choice": (correct + 1) % 4, "confidence": 3, "time_sec": 40})
    assert response.status_code == 200, response.text
    taught = response.json()
    assert taught["lesson"]["move"] == "EXPLAIN"
    assert taught["lesson"]["board"]["kind"] == "process-flow"
    assert len(taught["lesson"]["board"]["nodes"]) == 3
    restored = client.get(f"/learning/{student}").json()
    assert restored["preferences"]["geographyUnit"] == "monsoon"
    assert restored["view"]["lesson"]["step_id"] == taught["lesson"]["step_id"]
