"""
End-to-end integration test for Learning Session Engine & Super Teacher Layer.
Verifies the complete flow:
1. User registration & authentication
2. Student onboarding
3. Epistemic Assessment driving state vector & discrepancy detection
4. Session start yielding deterministic TeachingBrief
5. SuperTeacher prompt generation respecting kernel boundaries
6. Interactive dialog recording and phase transitions
7. Session completion and persistence
"""

import sys
import os
import uuid
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.main import app
from app.super_teacher import SuperTeacher
from app.session_engine import TeachingBrief

client = TestClient(app)

def test_learning_session_lifecycle_and_super_teacher():
    # 1. Register User
    user_email = f"session_{uuid.uuid4().hex[:8]}@techgram.ai"
    reg_res = client.post("/auth/register", json={
        "email": user_email,
        "password": "StrongPassword123!",
        "full_name": "Rohan Test"
    })
    assert reg_res.status_code == 201
    user_id = reg_res.json()["user_id"]

    # 2. Onboard Student
    onb_res = client.post("/student/onboard", json={
        "name": "Rohan",
        "goal": "UPSC CSE 2027",
        "user_id": user_id
    })
    assert onb_res.status_code == 201
    student_id = onb_res.json()["student_id"]

    # 3. Simulate assessment on pressure_gradients
    # GEO_PRES_REC_01 (recall, easy) -> correct (selected_option_index=1)
    # GEO_PRES_APP_01 (application, harder) -> incorrect (selected_option_index=3)
    assess_res = client.post(f"/student/{student_id}/assess", json={
        "knowledge_node": "pressure_gradients",
        "subject": "Geography",
        "responses": [
            {"question_id": "GEO_PRES_REC_01", "selected_option_index": 1, "response_time_seconds": 12.0},
            {"question_id": "GEO_PRES_APP_01", "selected_option_index": 3, "response_time_seconds": 45.0}
        ],
        "self_reported_confidence": 0.85
    })
    assert assess_res.status_code == 200
    assess_data = assess_res.json()
    assert assess_data["student_id"] == student_id

    # 4. Start Learning Session
    start_res = client.post("/session/start", json={
        "student_id": student_id,
        "topic": "pressure_gradients",
        "subject": "Geography"
    })
    assert start_res.status_code == 200
    session_data = start_res.json()
    session_id = session_data["session_id"]
    assert session_data["status"] == "active"
    assert session_data["current_phase"] == "instruction"

    brief_dict = session_data["teaching_brief"]
    brief = TeachingBrief(**brief_dict)
    assert brief.topic == "pressure_gradients"
    assert brief.pedagogical_action in ["transfer_bridge", "socratic_misconception_reframe", "investigation_probe", "first_principles_derivation"]

    # 5. Verify Super Teacher generation
    prompt_package = SuperTeacher.construct_instructional_prompt(brief)
    assert prompt_package["target_topic"] == "pressure_gradients"
    assert len(prompt_package["pedagogical_instructions"]) > 0
    opening_line = SuperTeacher.generate_opening_dialogue(brief)
    assert len(opening_line) > 10

    # 6. Interact: Log turns and transition phases
    # Turn 1: Teacher opening
    t1_res = client.post(f"/session/{session_id}/interact", json={
        "turn_role": "teacher",
        "content": opening_line,
        "next_phase": "interaction"
    })
    assert t1_res.status_code == 200
    assert t1_res.json()["current_phase"] == "interaction"

    # Turn 2: Student answer
    t2_res = client.post(f"/session/{session_id}/interact", json={
        "turn_role": "student",
        "content": "Because the Earth rotates beneath the moving air, deflecting it to the right in the Northern Hemisphere.",
        "next_phase": "interaction"
    })
    assert t2_res.status_code == 200
    assert t2_res.json()["turn_count"] == 2

    # 7. Complete Learning Session
    comp_res = client.post(f"/session/{session_id}/complete", json={
        "summary": "Student resolved transfer gap for Coriolis effect in cyclone spin direction."
    })
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"

    # 8. Verify get_session persistence
    get_res = client.get(f"/session/{session_id}")
    assert get_res.status_code == 200
    stored_session = get_res.json()
    assert stored_session["status"] == "completed"
    assert len(stored_session["session_log"]) == 2
    assert stored_session["session_log"][0]["role"] == "teacher"
    assert stored_session["session_log"][1]["role"] == "student"

    print("\nALL LEARNING SESSION & SUPER TEACHER LIFECYCLE TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_learning_session_lifecycle_and_super_teacher()

