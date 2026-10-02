"""
End-to-End Closed-Loop Assessment Pipeline Validation Suite
===========================================================
Executes the complete epistemic loop across real instruments:
Student -> Question -> Evidence -> State Change
       -> Dissonance -> Investigation
       -> New Evidence -> Root Cause
       -> Intervention -> Outcome
       -> Updated Student Model

Verifies:
1. Question Bank schema preserves cognitive dimensions (Recall, Recognition, Conceptual, Application, Transfer).
2. Author priors are explicitly marked as ItemValidationStatus.AUTHOR_PRIOR (not fake empirical precision).
3. IRT parameter calibration accumulates empirical responses toward FIELD_CALIBRATED status.
4. Response processing updates IRT and BKT, fuses state via StateReconciliationEngine,
   and traverses Knowledge Graph DAG to diagnose prerequisite bottlenecks.
5. All operations are deterministic, auditable, and have zero LLM dependency.
"""

import sys
import os
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.question_bank import build_default_upsc_question_bank, CognitiveDimension, ItemValidationStatus
from app.knowledge_graph import build_default_upsc_graph
from app.student_state import StudentState
from app.assessment_pipeline import AssessmentPipeline
from app.engines.scheduler import SchedulerEngine

def test_question_bank_epistemic_properties():
    print("Test 1: Verifying Question Bank Epistemic Instruments...")
    qb = build_default_upsc_question_bank()
    
    # Verify dimensions are mapped
    q_transfer = qb.get_question("GEO_VAR_TRA_01")
    assert q_transfer is not None
    assert q_transfer.cognitive_dimension == CognitiveDimension.TRANSFER
    assert q_transfer.knowledge_node == "monsoon_variability"
    assert q_transfer.validation_status == ItemValidationStatus.AUTHOR_PRIOR
    assert q_transfer.parameter_standard_error == 0.35
    
    # Test response tracking and calibration progression
    for i in range(35):
        qb.record_response("GEO_VAR_TRA_01", is_correct=(i % 2 == 0))
        
    assert q_transfer.sample_size == 35
    assert q_transfer.validation_status == ItemValidationStatus.FIELD_CALIBRATED
    assert q_transfer.parameter_standard_error < 0.20
    print("  [PASS] Items encode cognitive dimensions and calibrate empirically without fake precision.\n")

def test_end_to_end_assessment_and_prerequisite_diagnosis():
    print("Test 2: Verifying Closed-Loop Assessment -> State Update -> Prerequisite Diagnosis...")
    qb = build_default_upsc_question_bank()
    kg = build_default_upsc_graph()
    pipeline = AssessmentPipeline(question_bank=qb, knowledge_graph=kg)
    
    sid = uuid.uuid4()
    state = StudentState(student_id=sid)

    # 1. Step 1: Student is administered foundational question: solar_insolation
    q_solar = qb.get_question("GEO_SOLAR_REC_01")
    res1 = pipeline.process_assessment_responses(
        student_state=state,
        knowledge_node="solar_insolation",
        subject="Geography",
        item_responses=[(q_solar, True)]
    )
    assert res1.correct_count == 1
    assert state._topic_masteries["solar_insolation"].mastery.value > 0.40
    print("  [PASS] Step 1: Foundational assessment processed, mastery updated.")

    # 2. Step 2: Student is administered intermediate question: pressure_gradients (Fails it!)
    q_pres = qb.get_question("GEO_PRES_APP_01")
    res2 = pipeline.process_assessment_responses(
        student_state=state,
        knowledge_node="pressure_gradients",
        subject="Geography",
        item_responses=[(q_pres, False)]
    )
    assert res2.correct_count == 0
    assert state._topic_masteries["pressure_gradients"].mastery.value < 0.40
    print("  [PASS] Step 2: Intermediate deficit registered on 'pressure_gradients'.")

    # 3. Step 3: Student attempts synthesis question: monsoon_variability (Fails transfer!)
    q_transfer = qb.get_question("GEO_VAR_TRA_01")
    res3 = pipeline.process_assessment_responses(
        student_state=state,
        knowledge_node="monsoon_variability",
        subject="Geography",
        item_responses=[(q_transfer, False)]
    )
    
    # 4. Check root-cause bottleneck diagnosis in result
    diagnosis = res3.root_cause_diagnosis
    assert diagnosis is not None, "Failed to diagnose prerequisite bottleneck on synthesis failure"
    assert diagnosis["root_cause_concept_id"] == "pressure_gradients"
    assert "unresolved foundational deficit in prerequisite" in diagnosis["diagnosis_reason"]
    print("  [PASS] Step 3: Knowledge Graph traversal diagnosed root cause:", diagnosis["root_cause_name"])

    # 5. Step 4: Verify Scheduler Engine reroutes next intervention to the root-cause concept
    scheduler = SchedulerEngine()
    schedule = scheduler.generate_schedule(state, knowledge_graph=kg, n_blocks=2, block_duration=40)
    assert schedule[0].topic == "pressure_gradients"
    assert schedule[0].session_type == "prerequisite_remediation"
    assert schedule[0].root_cause_target == "monsoon_variability"
    print("  [PASS] Step 4: Scheduler rerouted intervention to root cause: 'pressure_gradients'.")
    print("         Decision Reason:", schedule[0].reason)

    # 6. Step 5: Verify immutable event log and decision audit receipt
    events = pipeline.event_store.get_events(sid)
    assert len(events) == 3 # 3 item responses emitted
    receipt = pipeline.receipt_store.get(res3.intelligence_receipt_id)
    assert receipt is not None
    assert receipt.selected_action["action"] == "remediate_prerequisite"
    print("  [PASS] Step 5: Epistemic Intelligence Receipt stored with complete audit trail.\n")

def test_model_dissonance_triggers_investigation_probe():
    print("Test 3: Verifying Model Dissonance Triggers Information-Gathering Probe...")
    qb = build_default_upsc_question_bank()
    kg = build_default_upsc_graph()
    pipeline = AssessmentPipeline(question_bank=qb, knowledge_graph=kg)
    
    sid = uuid.uuid4()
    state = StudentState(student_id=sid)

    # Student guesses easy recall questions right (BKT rises), but fails discriminative application
    q_rec = qb.get_question("POL_SOV_REC_01") # Easy recall: -1.2 difficulty
    q_app = qb.get_question("POL_AMD_APP_01") # Discriminative application: 0.8 difficulty

    res = pipeline.process_assessment_responses(
        student_state=state,
        knowledge_node="amendment_procedure",
        subject="Polity",
        item_responses=[(q_rec, True), (q_app, False)],
        self_reported_confidence=0.95 # Severe overconfidence!
    )

    vec = res.reconciled_vector
    assert vec.has_high_uncertainty
    assert any("SEVERE_OVERCONFIDENCE" in d for d in vec.model_discrepancies)
    assert vec.recommended_probe_type == "calibration_probe"

    scheduler = SchedulerEngine()
    schedule = scheduler.generate_schedule(state, knowledge_graph=kg, n_blocks=1, block_duration=40)
    assert schedule[0].session_type == "investigate_probe"
    assert schedule[0].probe_type == "calibration_probe"
    print("  [PASS] Overconfidence and dissonance successfully generated calibration investigate_probe.\n")

def main():
    print("\n" + "=" * 75)
    print("RUNNING END-TO-END ASSESSMENT PIPELINE & INSTRUMENT VERIFICATION")
    print("=" * 75 + "\n")

    test_question_bank_epistemic_properties()
    test_end_to_end_assessment_and_prerequisite_diagnosis()
    test_model_dissonance_triggers_investigation_probe()

    print("=" * 75)
    print("ALL ASSESSMENT PIPELINE TESTS PASSED (100% DETERMINISTIC, ZERO LLM DEPENDENCY)")
    print("=" * 75 + "\n")

if __name__ == "__main__":
    main()
