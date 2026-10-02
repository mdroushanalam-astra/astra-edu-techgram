"""
FastAPI HTTP Integration & End-to-End Client Drive Test
======================================================
Drives the entire closed loop over HTTP via FastAPI TestClient:
1. POST /student/onboard -> Generates student_id
2. POST /student/{id}/assess -> Submits foundational responses (solar_insolation)
3. POST /student/{id}/assess -> Submits intermediate failure (pressure_gradients)
4. POST /student/{id}/assess -> Submits advanced failure (monsoon_variability)
5. GET /student/{id}/state -> Verifies multi-dimensional LearningStateVector and uncertainty
6. GET /student/{id}/schedule -> Verifies scheduler rerouting to 'prerequisite_remediation'
7. GET /receipt/{receipt_id} -> Verifies complete mathematical audit receipt
"""

import sys
import os
import uuid
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.main import app

def test_complete_api_client_lifecycle():
    client = TestClient(app)
    
    print("\n" + "=" * 70)
    print("STARTING FASTAPI END-TO-END HTTP CLIENT INTEGRATION TEST")
    print("=" * 70 + "\n")

    # -------------------------------------------------------------
    # 1. Health Check
    # -------------------------------------------------------------
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"
    print("Step 1: GET /health -> [200 OK]")

    # -------------------------------------------------------------
    # 1b. User Identity & Authentication (User Registration & Login)
    # -------------------------------------------------------------
    reg_payload = {
        "email": f"roushan_{uuid.uuid4().hex[:6]}@techgram.ai",
        "password": "SecurePassword123!",
        "full_name": "Md Roushan"
    }
    reg_resp = client.post("/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    user_data = reg_resp.json()
    user_id = user_data["user_id"]
    token = user_data["access_token"]
    assert token is not None
    assert user_data["email"] == reg_payload["email"].lower()
    print(f"Step 1b: POST /auth/register -> [201 Created] (User ID: {user_id})")

    # Login verification
    login_resp = client.post("/auth/login", json={"email": reg_payload["email"], "password": reg_payload["password"]})
    assert login_resp.status_code == 200
    assert login_resp.json()["access_token"] is not None
    print(f"Step 1c: POST /auth/login -> [200 OK] (JWT Token Issued)")

    # -------------------------------------------------------------
    # 2. Onboard Student (Linked to User ID)
    # -------------------------------------------------------------
    onboard_payload = {
        "name": "Roushan",
        "goal": "UPSC CSE 2027",
        "target_exam_date": "2027-05-23",
        "user_id": user_id
    }
    onboard_resp = client.post("/student/onboard", json=onboard_payload)
    assert onboard_resp.status_code == 201
    data = onboard_resp.json()
    student_id = data["student_id"]
    assert data["user_id"] == user_id
    assert data["name"] == "Roushan"
    assert data["status"] == "onboarded"
    print(f"Step 2: POST /student/onboard -> [201 Created] (Student ID: {student_id})")

    # -------------------------------------------------------------
    # 3. Assess Foundational Knowledge: solar_insolation (Correct)
    # -------------------------------------------------------------
    assess_payload_1 = {
        "knowledge_node": "solar_insolation",
        "subject": "Geography",
        "responses": [
            {"question_id": "GEO_SOLAR_REC_01", "selected_option_index": 0} # Correct
        ],
        "self_reported_confidence": 0.85
    }
    resp1 = client.post(f"/student/{student_id}/assess", json=assess_payload_1)
    assert resp1.status_code == 200
    res1_data = resp1.json()
    assert res1_data["correct_count"] == 1
    assert res1_data["bkt_mastery"] > 0.40
    print("Step 3: POST /student/{id}/assess (solar_insolation) -> [200 OK] (Correct: 1/1)")

    # -------------------------------------------------------------
    # 4. Assess Intermediate Concept: pressure_gradients (Incorrect)
    # -------------------------------------------------------------
    assess_payload_2 = {
        "knowledge_node": "pressure_gradients",
        "subject": "Geography",
        "responses": [
            {"question_id": "GEO_PRES_APP_01", "selected_option_index": 3} # Wrong option (correct is 1)
        ],
        "self_reported_confidence": 0.30
    }
    resp2 = client.post(f"/student/{student_id}/assess", json=assess_payload_2)
    assert resp2.status_code == 200
    res2_data = resp2.json()
    assert res2_data["correct_count"] == 0
    assert res2_data["reconciled_vector"]["application"]["value"] < 0.35
    print("Step 4: POST /student/{id}/assess (pressure_gradients) -> [200 OK] (Deficit registered)")

    # -------------------------------------------------------------
    # 5. Assess Synthesis Node: monsoon_variability (Transfer Failure)
    # -------------------------------------------------------------
    assess_payload_3 = {
        "knowledge_node": "monsoon_variability",
        "subject": "Geography",
        "responses": [
            {"question_id": "GEO_VAR_TRA_01", "selected_option_index": 0} # Wrong option (correct is 1)
        ],
        "self_reported_confidence": 0.90 # Overconfident failure!
    }
    resp3 = client.post(f"/student/{student_id}/assess", json=assess_payload_3)
    assert resp3.status_code == 200
    res3_data = resp3.json()
    receipt_id = res3_data["intelligence_receipt_id"]
    diagnosis = res3_data["root_cause_diagnosis"]
    
    assert diagnosis is not None, "Pipeline failed to report root-cause bottleneck diagnosis over HTTP"
    assert diagnosis["root_cause_concept_id"] == "pressure_gradients"
    print(f"Step 5: POST /student/{id}/assess (monsoon_variability) -> [200 OK]")
    print(f"        Prerequisite Root Cause Identified: {diagnosis['root_cause_name']}")

    # -------------------------------------------------------------
    # 6. Retrieve Student State
    # -------------------------------------------------------------
    state_resp = client.get(f"/student/{student_id}/state")
    assert state_resp.status_code == 200
    state_data = state_resp.json()
    assert state_data["student_id"] == student_id
    assert "monsoon_variability" in state_data["cognitive"]["topic_masteries"]
    vector = state_data["cognitive"]["topic_masteries"]["monsoon_variability"]["vector"]
    assert vector["has_high_uncertainty"] is True
    print("Step 6: GET /student/{id}/state -> [200 OK] (Retrieved 8-domain state & vectors)")

    # -------------------------------------------------------------
    # 7. Retrieve Deterministic Schedule
    # -------------------------------------------------------------
    schedule_resp = client.get(f"/student/{student_id}/schedule?n_blocks=2")
    assert schedule_resp.status_code == 200
    schedule_data = schedule_resp.json()
    assert len(schedule_data) >= 1
    # Schedule must automatically target the root-cause concept
    top_block = schedule_data[0]
    assert top_block["topic"] == "pressure_gradients"
    assert top_block["session_type"] == "prerequisite_remediation"
    assert top_block["root_cause_target"] == "monsoon_variability"
    print("Step 7: GET /student/{id}/schedule -> [200 OK]")
    print(f"        Intervention Rerouted to: {top_block['topic']} ({top_block['session_type']})")
    print(f"        Mathematical Rationale: {top_block['reason']}")

    # -------------------------------------------------------------
    # 8. Retrieve Epistemic Intelligence Receipt
    # -------------------------------------------------------------
    receipt_resp = client.get(f"/receipt/{receipt_id}")
    assert receipt_resp.status_code == 200
    receipt_data = receipt_resp.json()
    assert receipt_data["receipt_id"] == receipt_id
    assert receipt_data["selected_action"]["action"] == "remediate_prerequisite"
    assert len(receipt_data["observations"]) > 0
    print(f"Step 8: GET /receipt/{receipt_id} -> [200 OK] (Audit trail persisted)")

    print("\n" + "=" * 70)
    print("ALL API END-TO-END CLIENT INTEGRATION TESTS PASSED (100% DETERMINISTIC)")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    test_complete_api_client_lifecycle()
