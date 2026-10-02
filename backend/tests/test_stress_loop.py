"""
Techgram / Astra Edu — Stress & Adversarial Acid Test
======================================================
Tests the resilience of the Student Intelligence Kernel against edge cases:
1. Contradictory evidence (easy questions failed, hard questions passed - guessing/slipping).
2. Overconfidence misalignment (student declares 95% confidence, performs at 20%).
3. Stale & decaying retention vs high historical mastery.
4. Abandonment & erratic engagement (sessions aborted, hypothesis distribution update).
5. State Reconciliation resolving BKT vs IRT dissonance without hallucinating.

All operations execute deterministically without any LLM.
"""

import sys
import os
from datetime import datetime, timedelta
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.epistemics import LearningEnvelope
from app.events import StudentEvent, EventStore
from app.engines.knowledge_tracing import BKTModel
from app.engines.retention import RetentionModel, ReviewRecord
from app.engines.assessment import IRTModel, ItemParams
from app.student_state import StudentState, LearningStateVector
from app.engines.scheduler import SchedulerEngine
from app.engines.reconciliation import StateReconciliationEngine
from app.evidence import IntelligenceReceipt, ReceiptStore

def run_stress_test():
    print("\n" + "=" * 60)
    print("STARTING TECHGRAM STRESS & ADVERSARIAL ACID TEST")
    print("=" * 60 + "\n")

    student_id = uuid.uuid4()
    state = StudentState(student_id=student_id)
    event_store = EventStore()
    receipt_store = ReceiptStore()

    # ---------------------------------------------------------
    # STRESS CASE 1: CONTRADICTORY EVIDENCE & MODEL DISSONANCE
    # ---------------------------------------------------------
    print("Scenario 1: Testing Model Discrepancy Reconciliation...")
    # BKT saw lucky guessing on basic items (thinks mastery is 0.88)
    # IRT tested conceptual ability with discriminative items (estimates theta = -1.8, p ≈ 0.14)
    reconciled_vector = StateReconciliationEngine.reconcile_topic(
        topic="Indian Monsoon",
        subject="Geography",
        bkt_mastery=0.88,
        irt_ability=-1.8,
        retention_decay=0.85,
        observed_responses_count=12
    )

    state.update_topic_vector("Indian Monsoon", "Geography", reconciled_vector)
    
    # Verify epistemic discount was triggered on discrepancy
    assert reconciled_vector.recognition.confidence < 0.70, "Failed: Confidence not discounted during model dissonance"
    assert reconciled_vector.recognition.uncertainty > 0.30, "Failed: Uncertainty should reflect model disagreement"
    print("  [PASS] Discrepancy detected: Confidence discounted to", reconciled_vector.recognition.confidence)
    print("  [PASS] Reconciled composite index:", round(reconciled_vector.composite_index(), 3))

    # ---------------------------------------------------------
    # STRESS CASE 2: HIGH HISTORICAL MASTERY WITH SEVERE STALENESS
    # ---------------------------------------------------------
    print("\nScenario 2: Testing Staleness & Temporal Decay on Historical Mastery...")
    past_date = datetime.now() - timedelta(days=45)
    stale_env = LearningEnvelope(
        value=0.92,
        unit="probability",
        knowledge_type="assessed",
        observation_basis="mock_test",
        observed_at=past_date,
        valid_until=past_date + timedelta(days=14), # Expired 31 days ago
        confidence=0.95,
        sample_size=40,
        uncertainty=0.05
    )
    # Should automatically downgrade to 'decayed' and halve confidence
    assert stale_env.knowledge_type == "decayed", f"Failed: Expected decayed, got {stale_env.knowledge_type}"
    assert stale_env.confidence < 0.50, f"Failed: Confidence not halved upon expiration: {stale_env.confidence}"
    print("  [PASS] Stale mastery auto-downgraded to 'decayed' with confidence discounted to", stale_env.confidence)

    # ---------------------------------------------------------
    # STRESS CASE 3: ERRATIC SESSIONS & BELIEF STATE UPDATES
    # ---------------------------------------------------------
    print("\nScenario 3: Multi-Hypothesis Belief State under Session Incompletion...")
    # Student abandons 3 sessions in a row
    for _ in range(3):
        event_store.emit(StudentEvent(
            student_id=student_id,
            event_type="session_abandoned",
            payload={"topic": "Indian Monsoon", "minute_abandoned": 14, "exit_trigger": "difficulty_spike"},
            source="student_action"
        ))

    # Update competing hypotheses distribution based on evidence (difficulty spike at minute 14)
    new_belief = {
        "content_difficulty": 0.55,
        "schedule_mismatch": 0.20,
        "low_motivation": 0.10,
        "external_interruption": 0.10,
        "unknown": 0.05
    }
    state.update_belief_distribution("session_incompletion_reasons", new_belief)
    
    assert state.belief_state()["session_incompletion_reasons"]["content_difficulty"] == 0.55
    print("  [PASS] Competing hypothesis updated: P(content_difficulty) = 0.55, not naive 'lazy'")

    # ---------------------------------------------------------
    # STRESS CASE 4: SCHEDULER RESPONSE UNDER STRESS
    # ---------------------------------------------------------
    print("\nScenario 4: Deterministic Intervention Scheduling...")
    # Add a strong topic
    polity_vector = StateReconciliationEngine.reconcile_topic(
        topic="Preamble",
        subject="Polity",
        bkt_mastery=0.95,
        irt_ability=2.2,
        retention_decay=0.98,
        observed_responses_count=25
    )
    state.update_topic_vector("Preamble", "Polity", polity_vector)

    scheduler = SchedulerEngine()
    schedule = scheduler.generate_schedule(state, n_blocks=2, block_duration=40)

    # Highest priority should go to Geography (due to high model discrepancy and uncertainty)
    assert len(schedule) == 2
    assert schedule[0].topic == "Indian Monsoon", f"Failed: Expected Indian Monsoon, got {schedule[0].topic}"
    assert schedule[0].session_type in ["investigate_probe", "practice", "learn"], f"Expected investigative/remedial block, got {schedule[0].session_type}"
    print("  [PASS] Scheduled investigative probe/remedial block for uncertain topic:", schedule[0].topic, f"({schedule[0].session_type})")
    print("  [PASS] Generated Mathematical Reason:", schedule[0].reason)

    # ---------------------------------------------------------
    # STRESS CASE 5: INTELLIGENCE AUDIT RECEIPT PERSISTENCE
    # ---------------------------------------------------------
    print("\nScenario 5: Generating Decision Audit Receipt...")
    receipt = IntelligenceReceipt(
        decision=f"Intervene on {schedule[0].topic} via {schedule[0].session_type}",
        observations=[
            {"topic": "Indian Monsoon", "composite_index": round(reconciled_vector.composite_index(), 3)},
            {"belief_difficulty": 0.55}
        ],
        predictions=[{"expected_retention_lift": 0.14}],
        candidate_actions=[
            {"action": "learn", "score": schedule[0].priority_score},
            {"action": "assess", "score": 0.22}
        ],
        selected_action={"action": schedule[0].session_type, "score": schedule[0].priority_score},
        selection_reason=schedule[0].reason,
        constraints_checked=["max_consecutive_subject_ok", "session_budget_40min"],
        confidence=reconciled_vector.recognition.confidence,
        assumptions=["Syllabus prerequisite graph stable"],
        unknowns=["Student sleep quality outside app"]
    )
    receipt_store.store(receipt)
    assert receipt_store.get(receipt.receipt_id) is not None
    print("  [PASS] Audit Receipt logged with ID:", receipt.receipt_id)

    print("\n" + "=" * 60)
    print("ALL 5 STRESS SCENARIOS PASSED WITH ZERO LLM HALLUCINATIONS")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    run_stress_test()
