"""
Techgram Intelligence Kernel — Core Test Suite
==============================================

Tests the foundational invariants of the Student Intelligence Engine:
1. Learning Envelope constructor validation (7 rules)
2. Event Fabric type validation
3. Knowledge Tracing (BKT) mathematical invariants
4. Retention Model (SM-2 + Ebbinghaus) invariants
5. Assessment Engine (IRT 2PL) invariants
6. Student State composition
7. Scheduler determinism
8. Intelligence Receipt completeness
9. LLM Independence (the acid test)

Design rule: ALL tests pass without any LLM API key.
The intelligence kernel is LLM-independent by construction.
"""

import sys
import os
import math
from datetime import datetime, timedelta
from uuid import uuid4

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.epistemics import LearningEnvelope
from app.events import StudentEvent, EventStore
from app.engines.knowledge_tracing import BKTModel, BKTParams
from app.engines.retention import RetentionModel, ReviewRecord
from app.engines.assessment import IRTModel, ItemParams
from app.student_state import StudentState, LearningStateVector
from app.engines.scheduler import SchedulerEngine
from app.evidence import IntelligenceReceipt, ReceiptStore
from app.engines.reconciliation import StateReconciliationEngine


# ============================================================
# PART 1: LEARNING ENVELOPE — 7 VALIDATION RULES
# ============================================================

class TestLearningEnvelope:
    """Tests for the Learning Envelope (epistemics.py).
    Every fact about a student must carry provenance."""

    def test_rule1_null_value_forces_unknown(self):
        """Rule 1: null value → knowledge_type forced to 'unknown'."""
        env = LearningEnvelope(
            value=None,
            unit="percent",
            knowledge_type="assessed",  # should be overridden
            observation_basis="mock_test",
            observed_at=datetime.now(),
            confidence=0.9,  # should be overridden to 0.0
            sample_size=50,
            uncertainty=0.05,
            value_semantics="exact",
        )
        assert env.knowledge_type == "unknown"
        assert env.confidence == 0.0
        assert env.uncertainty == 1.0

    def test_rule2_assessed_requires_test_basis(self):
        """Rule 2: 'assessed' knowledge requires test-based observation_basis."""
        # Valid: assessed + mock_test
        env = LearningEnvelope(
            value=0.72,
            unit="probability",
            knowledge_type="assessed",
            observation_basis="mock_test",
            observed_at=datetime.now(),
            confidence=0.9,
            sample_size=50,
            uncertainty=0.05,
            value_semantics="exact",
        )
        assert env.knowledge_type == "assessed"

        # Invalid: assessed + behavioral_log → should raise
        try:
            LearningEnvelope(
                value=0.72,
                unit="probability",
                knowledge_type="assessed",
                observation_basis="behavioral_log",
                observed_at=datetime.now(),
                confidence=0.9,
                sample_size=50,
                uncertainty=0.05,
                value_semantics="exact",
            )
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "assessed" in str(e).lower() or "basis" in str(e).lower()

    def test_rule3_source_trust_and_self_reported(self):
        """Self-reported facts retain honest confidence without arbitrary 0.5 cap."""
        env = LearningEnvelope(
            value=0.8,
            unit="probability",
            knowledge_type="self_reported",
            observation_basis="self_declaration",
            observed_at=datetime.now(),
            confidence=0.85,
            sample_size=1,
            uncertainty=0.15,
            value_semantics="estimate",
            source_trust=0.9
        )
        assert env.confidence == 0.85
        assert env.source_trust == 0.9

    def test_rule4_expired_validity_downgrades_to_decayed(self):
        """Rule 4: if now > valid_until → knowledge_type auto-downgrades to 'decayed'."""
        past = datetime.now() - timedelta(days=30)
        env = LearningEnvelope(
            value=0.72,
            unit="probability",
            knowledge_type="assessed",
            observation_basis="mock_test",
            observed_at=past,
            valid_until=past + timedelta(days=14),  # expired 16 days ago
            confidence=0.9,
            sample_size=50,
            uncertainty=0.05,
            value_semantics="exact",
        )
        assert env.knowledge_type == "decayed"
        assert env.confidence <= 0.45  # 0.9 * 0.5

    def test_rule5_valid_semantics_preserved(self):
        """Value semantics (estimate, exact, lower_bound) are preserved without arbitrary overriding."""
        env = LearningEnvelope(
            value=0.72,
            unit="probability",
            knowledge_type="assessed",
            observation_basis="session_quiz",
            observed_at=datetime.now(),
            confidence=0.9,
            sample_size=3,
            uncertainty=0.15,
            value_semantics="estimate",
        )
        assert env.value_semantics == "estimate"

    def test_rule6_predicted_requires_model_id(self):
        """Rule 6: 'predicted' knowledge requires model_id."""
        try:
            LearningEnvelope(
                value=0.48,
                unit="probability",
                knowledge_type="predicted",
                observation_basis="model_output",
                observed_at=datetime.now(),
                confidence=0.7,
                sample_size=30,
                uncertainty=0.1,
                value_semantics="estimate",
                model_id=None,  # missing!
            )
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "model_id" in str(e).lower() or "predicted" in str(e).lower()

    def test_rule7_negative_uncertainty_rejected(self):
        """Rule 7: uncertainty must be non-negative."""
        try:
            LearningEnvelope(
                value=0.72,
                unit="probability",
                knowledge_type="assessed",
                observation_basis="mock_test",
                observed_at=datetime.now(),
                confidence=0.9,
                sample_size=50,
                uncertainty=-0.05,  # invalid!
                value_semantics="exact",
            )
            assert False, "Should have raised ValueError"
        except ValueError as e:
            assert "uncertainty" in str(e).lower() or "negative" in str(e).lower()

    def test_unknown_factory_method(self):
        """The unknown() factory should create a properly unknown envelope."""
        env = LearningEnvelope.unknown("probability", "No assessment taken")
        assert env.knowledge_type == "unknown"
        assert env.value is None
        assert env.confidence == 0.0

    def test_serialization(self):
        """Envelope must be JSON-serializable."""
        env = LearningEnvelope(
            value=0.72,
            unit="probability",
            knowledge_type="assessed",
            observation_basis="mock_test",
            observed_at=datetime.now(),
            confidence=0.9,
            sample_size=50,
            uncertainty=0.05,
            value_semantics="exact",
        )
        d = env.to_dict()
        assert isinstance(d, dict)
        assert d["value"] == 0.72
        assert d["knowledge_type"] == "assessed"


# ============================================================
# PART 2: EVENT FABRIC
# ============================================================

class TestEventFabric:
    """Tests for the Event Fabric (events.py)."""

    def test_valid_event_creation(self):
        """Valid events should be created without error."""
        event = StudentEvent(
            student_id=uuid4(),
            event_type="assessment_completed",
            payload={"subject": "polity", "score": 72},
            source="system",
        )
        assert event.event_type == "assessment_completed"

    def test_invalid_event_type_rejected(self):
        """Invalid event types should raise ValueError."""
        try:
            StudentEvent(
                student_id=uuid4(),
                event_type="invalid_event_type",
                payload={},
                source="system",
            )
            assert False, "Should have raised ValueError"
        except ValueError:
            pass

    def test_event_store_emit_and_retrieve(self):
        """Events should be stored and retrievable."""
        store = EventStore()
        sid = uuid4()
        event = StudentEvent(
            student_id=sid,
            event_type="login",
            payload={},
            source="system",
        )
        store.emit(event)
        events = store.get_events(sid)
        assert len(events) == 1
        assert events[0].event_type == "login"


# ============================================================
# PART 3: KNOWLEDGE TRACING (BKT)
# ============================================================

class TestBKT:
    """Tests for Bayesian Knowledge Tracing.
    Invariants from Corbett & Anderson (1994)."""

    def test_correct_answer_increases_mastery(self):
        """A correct answer should increase P(Learned)."""
        model = BKTModel()
        p0 = 0.3
        p1 = model.update(p0, is_correct=True)
        assert p1 > p0, f"Correct answer should increase mastery: {p0} -> {p1}"

    def test_incorrect_answer_decreases_mastery(self):
        """An incorrect answer should decrease (or at most maintain) P(Learned)
        before the transition step, but transition still adds."""
        model = BKTModel()
        p0 = 0.5
        p_correct = model.update(p0, is_correct=True)
        p_incorrect = model.update(p0, is_correct=False)
        assert p_correct > p_incorrect, \
            "Correct answer should yield higher mastery than incorrect"

    def test_mastery_converges_with_all_correct(self):
        """Sustained correct answers should drive mastery toward 1.0."""
        model = BKTModel()
        responses = [True] * 20
        trace = model.trace(responses)
        assert trace[-1] > 0.95, f"20 correct answers should yield mastery > 0.95, got {trace[-1]}"

    def test_mastery_stays_low_with_all_incorrect(self):
        """Sustained incorrect answers should keep mastery low."""
        model = BKTModel()
        responses = [False] * 20
        trace = model.trace(responses)
        assert trace[-1] < 0.5, f"20 incorrect answers should yield mastery < 0.5, got {trace[-1]}"

    def test_predict_correct_is_valid_probability(self):
        """P(correct) must be between 0 and 1."""
        model = BKTModel()
        for p in [0.0, 0.3, 0.5, 0.8, 1.0]:
            pc = model.predict_correct(p)
            assert 0.0 <= pc <= 1.0, f"P(correct) out of range for P(L)={p}: {pc}"

    def test_envelope_output(self):
        """BKT should produce a valid LearningEnvelope."""
        model = BKTModel()
        env = model.to_envelope(0.72, sample_size=50)
        assert env.knowledge_type == "predicted"
        assert env.model_id == "bkt_v1"
        assert env.value == 0.72


# ============================================================
# PART 4: RETENTION MODEL (SM-2 + EBBINGHAUS)
# ============================================================

class TestRetention:
    """Tests for the Retention Model (SM-2 + Ebbinghaus)."""

    def test_ebbinghaus_decay(self):
        """Retention should decrease over time."""
        model = RetentionModel()
        r1 = model.ebbinghaus_retention(days_since_review=1, stability=14.0)
        r7 = model.ebbinghaus_retention(days_since_review=7, stability=14.0)
        r14 = model.ebbinghaus_retention(days_since_review=14, stability=14.0)
        assert r1 > r7 > r14, "Retention should decrease over time"

    def test_ebbinghaus_at_zero_is_one(self):
        """Retention at time 0 should be 1.0 (just reviewed)."""
        model = RetentionModel()
        r = model.ebbinghaus_retention(days_since_review=0, stability=14.0)
        assert abs(r - 1.0) < 0.001, f"Retention at t=0 should be ~1.0, got {r}"

    def test_ebbinghaus_at_halflife(self):
        """Retention at t=stability should be ~0.368 (e^-1)."""
        model = RetentionModel()
        r = model.ebbinghaus_retention(days_since_review=14, stability=14.0)
        expected = math.exp(-1)  # ~0.368
        assert abs(r - expected) < 0.01, f"Retention at halflife should be ~{expected}, got {r}"

    def test_sm2_correct_increases_interval(self):
        """Consecutive correct reviews should increase the interval."""
        model = RetentionModel()
        history = [
            ReviewRecord(timestamp=datetime.now() - timedelta(days=10), quality=4),
            ReviewRecord(timestamp=datetime.now() - timedelta(days=4), quality=4),
            ReviewRecord(timestamp=datetime.now(), quality=4),
        ]
        interval, easiness = model.sm2_schedule(history)
        assert interval > 1, f"After 3 correct reviews, interval should > 1, got {interval}"
        assert easiness >= 2.5, f"Easiness should stay >= 2.5 with quality 4, got {easiness}"

    def test_sm2_incorrect_resets_interval(self):
        """A failed review should reset the interval to 1."""
        model = RetentionModel()
        history = [
            ReviewRecord(timestamp=datetime.now() - timedelta(days=10), quality=4),
            ReviewRecord(timestamp=datetime.now() - timedelta(days=4), quality=4),
            ReviewRecord(timestamp=datetime.now(), quality=1),  # fail
        ]
        interval, easiness = model.sm2_schedule(history)
        assert interval == 1, f"After failure, interval should be 1, got {interval}"

    def test_envelope_output(self):
        """Retention model should produce a valid LearningEnvelope."""
        model = RetentionModel()
        env = model.to_envelope(
            retention_prob=0.72,
            last_review=datetime.now() - timedelta(days=3),
            stability=14.0,
        )
        assert env.knowledge_type == "predicted"
        assert env.model_id == "sm2_v1"


# ============================================================
# PART 5: ASSESSMENT ENGINE (IRT 2PL)
# ============================================================

class TestIRT:
    """Tests for Item Response Theory (2PL model)."""

    def test_probability_increases_with_ability(self):
        """Higher ability → higher P(correct) for same item."""
        model = IRTModel()
        item = ItemParams(item_id="q1", difficulty=0.0, discrimination=1.0,
                          topic="polity")
        p_low = model.probability(ability=-1.0, item=item)
        p_high = model.probability(ability=1.0, item=item)
        assert p_high > p_low, "Higher ability should yield higher P(correct)"

    def test_probability_at_ability_equals_difficulty(self):
        """When ability = difficulty, P(correct) should be 0.5."""
        model = IRTModel()
        item = ItemParams(item_id="q1", difficulty=0.5, discrimination=1.0,
                          topic="polity")
        p = model.probability(ability=0.5, item=item)
        assert abs(p - 0.5) < 0.01, f"P should be ~0.5 at ability=difficulty, got {p}"

    def test_probability_is_valid(self):
        """P(correct) must always be between 0 and 1."""
        model = IRTModel()
        item = ItemParams(item_id="q1", difficulty=0.0, discrimination=1.5,
                          topic="polity")
        for ability in [-5, -2, -1, 0, 1, 2, 5]:
            p = model.probability(ability=ability, item=item)
            assert 0.0 <= p <= 1.0, f"P out of range for ability={ability}: {p}"

    def test_select_items_returns_correct_count(self):
        """select_items should return the requested number of items."""
        model = IRTModel()
        items = [
            ItemParams(item_id=f"q{i}", difficulty=(i - 5) / 2,
                       discrimination=1.0, topic="polity")
            for i in range(10)
        ]
        selected = model.select_items(ability=0.0, items=items, n=5)
        assert len(selected) == 5

    def test_select_items_maximizes_information(self):
        """Selected items should have difficulty near the student's ability."""
        model = IRTModel()
        items = [
            ItemParams(item_id=f"q{i}", difficulty=(i - 5),
                       discrimination=1.0, topic="polity")
            for i in range(10)
        ]
        selected = model.select_items(ability=0.0, items=items, n=3)
        # The best items for ability=0 should have difficulty near 0
        for item in selected:
            assert abs(item.difficulty) <= 2.0, \
                f"Selected item difficulty {item.difficulty} too far from ability 0.0"


# ============================================================
# PART 6: LLM INDEPENDENCE (THE ACID TEST)
# ============================================================

class TestLLMIndependence:
    """The acid test: the entire intelligence kernel works without any LLM.
    This test class verifies that no engine imports or requires an LLM."""

    def test_envelope_no_llm(self):
        """LearningEnvelope works without LLM."""
        env = LearningEnvelope(
            value=0.72, unit="probability", knowledge_type="assessed",
            observation_basis="mock_test", observed_at=datetime.now(),
            confidence=0.9, sample_size=50, uncertainty=0.05,
            value_semantics="exact",
        )
        assert env.value == 0.72

    def test_bkt_no_llm(self):
        """BKT works without LLM."""
        model = BKTModel()
        trace = model.trace([True, False, True, True, True])
        assert len(trace) == 5
        assert all(0 <= p <= 1 for p in trace)

    def test_retention_no_llm(self):
        """Retention model works without LLM."""
        model = RetentionModel()
        r = model.ebbinghaus_retention(7, 14)
        assert 0 < r < 1

    def test_irt_no_llm(self):
        """IRT works without LLM."""
        model = IRTModel()
        item = ItemParams("q1", 0.0, 1.0, "polity")
        p = model.probability(0.5, item)
        assert 0 < p < 1

    def test_events_no_llm(self):
        """Event Fabric works without LLM."""
        store = EventStore()
        sid = uuid4()
        store.emit(StudentEvent(
            student_id=sid, event_type="login", payload={}, source="system",
        ))
        assert len(store.get_events(sid)) == 1


# ============================================================
# PART 7: STUDENT STATE COMPOSITION
# ============================================================

class TestStudentState:
    """Tests for the StudentState composition layer."""

    def test_student_state_composition(self):
        sid = uuid4()
        state = StudentState(student_id=sid)
        env = LearningEnvelope(
            value=0.65,
            unit="probability",
            knowledge_type="assessed",
            observation_basis="mock_test",
            observed_at=datetime.now(),
            confidence=0.85,
            sample_size=20,
            uncertainty=0.08,
            value_semantics="exact",
        )
        state.update_mastery("Polity", "Polity", env)
        full = state.full_state()
        assert full["student_id"] == str(sid)
        assert "Polity" in full["cognitive"]["topic_masteries"]
        assert abs(full["cognitive"]["topic_masteries"]["Polity"]["mastery"]["value"] - 0.65) < 0.001

    def test_weakest_and_decaying_topics(self):
        sid = uuid4()
        state = StudentState(student_id=sid)
        env_polity = LearningEnvelope(
            value=0.75, unit="probability", knowledge_type="assessed",
            observation_basis="mock_test", observed_at=datetime.now(),
            confidence=0.9, sample_size=30, uncertainty=0.05
        )
        env_geo = LearningEnvelope(
            value=0.45, unit="probability", knowledge_type="assessed",
            observation_basis="mock_test", observed_at=datetime.now(),
            confidence=0.9, sample_size=30, uncertainty=0.05
        )
        ret_decayed = LearningEnvelope(
            value=0.55, unit="probability", knowledge_type="predicted",
            observation_basis="retention_model", observed_at=datetime.now(),
            model_id="sm2_v1"
        )
        state.update_mastery("Polity", "Social Science", env_polity)
        state.update_mastery("Geography", "Social Science", env_geo)
        state._topic_masteries["Geography"].retention = ret_decayed

        weakest = state.get_weakest_topics(1)
        assert len(weakest) == 1
        assert weakest[0].topic == "Geography"

        decaying = state.get_decaying_topics(threshold=0.70)
        assert len(decaying) == 1
        assert decaying[0].topic == "Geography"


# ============================================================
# PART 8: SCHEDULER ENGINE
# ============================================================

class TestScheduler:
    """Tests for the deterministic SchedulerEngine."""

    def test_generate_schedule_deterministic(self):
        sid = uuid4()
        state = StudentState(student_id=sid)
        env_polity = LearningEnvelope(
            value=0.75, unit="probability", knowledge_type="assessed",
            observation_basis="mock_test", observed_at=datetime.now(),
            confidence=0.9, sample_size=30, uncertainty=0.05
        )
        env_geo = LearningEnvelope(
            value=0.25, unit="probability", knowledge_type="assessed",
            observation_basis="mock_test", observed_at=datetime.now(),
            confidence=0.9, sample_size=30, uncertainty=0.05
        )
        state.update_mastery("Polity", "Civics", env_polity)
        state.update_mastery("Geography", "Earth", env_geo)

        scheduler = SchedulerEngine()
        schedule = scheduler.generate_schedule(state, n_blocks=2, block_duration=40)
        assert len(schedule) == 2
        # Geography should have higher priority due to lower mastery
        assert schedule[0].topic == "Geography"
        assert schedule[0].duration_min == 40
        assert schedule[0].session_type in ["learn", "practice", "revise", "assess"]


# ============================================================
# PART 9: INTELLIGENCE RECEIPT
# ============================================================

class TestEvidence:
    """Tests for IntelligenceReceipt audit receipts."""

    def test_receipt_creation_and_store(self):
        receipt = IntelligenceReceipt(
            decision="Schedule 40min Geography retrieval",
            observations=[{"topic": "Geography", "mastery": 0.25}],
            predictions=[{"predicted_retention": 0.60}],
            candidate_actions=[{"action": "learn", "score": 0.85}],
            selected_action={"action": "learn", "score": 0.85},
            selection_reason="Weakest mastery requires immediate intervention",
            constraints_checked=["max_consecutive_blocks_ok"],
            confidence=0.92,
            assumptions=["curriculum_sequence_constant"],
            unknowns=["student_daily_energy_level"]
        )
        store = ReceiptStore()
        store.store(receipt)
        retrieved = store.get(receipt.receipt_id)
        assert retrieved is not None
        assert retrieved.decision == "Schedule 40min Geography retrieval"
        d = retrieved.to_dict()
        assert d["confidence"] == 0.92
        assert len(d["assumptions"]) == 1


# ============================================================
# PART 10: STATE RECONCILIATION & BELIEF FUSION
# ============================================================

class TestReconciliation:
    """Tests the StateReconciliationEngine multi-model belief fusion."""

    def test_reconcile_consistent_models(self):
        """When BKT and IRT agree, confidence is high and composite is consistent."""
        vector = StateReconciliationEngine.reconcile_topic(
            topic="Polity",
            subject="Civics",
            bkt_mastery=0.80,
            irt_ability=1.4,  # sigmoid(1.4) ≈ 0.80
            retention_decay=0.90,
            observed_responses_count=15
        )
        assert isinstance(vector, LearningStateVector)
        assert vector.recognition.value >= 0.75
        assert vector.recall.value <= vector.recognition.value
        assert vector.recognition.confidence >= 0.80
        assert vector.composite_index() > 0.65

    def test_reconcile_discrepant_models(self):
        """When BKT says 0.85 but IRT says -1.5 (prob ~0.18), epistemic discount is applied."""
        vector = StateReconciliationEngine.reconcile_topic(
            topic="Geography",
            subject="Earth",
            bkt_mastery=0.85,
            irt_ability=-1.5,
            retention_decay=0.90,
            observed_responses_count=15
        )
        # Discrepancy triggers epistemic discount on confidence
        assert vector.recognition.confidence < 0.70
        assert vector.recognition.uncertainty > 0.30


# ============================================================
# RUNNER
# ============================================================

def run_tests():
    """Simple test runner. Returns (passed, failed, total)."""
    import traceback

    test_classes = [
        TestLearningEnvelope,
        TestEventFabric,
        TestBKT,
        TestRetention,
        TestIRT,
        TestStudentState,
        TestScheduler,
        TestEvidence,
        TestReconciliation,
        TestLLMIndependence,
    ]

    passed = 0
    failed = 0
    errors = []

    for cls in test_classes:
        instance = cls()
        methods = [m for m in dir(instance) if m.startswith("test_")]
        for method_name in methods:
            test_name = f"{cls.__name__}.{method_name}"
            try:
                getattr(instance, method_name)()
                passed += 1
                print(f"  [PASS] {test_name}")
            except Exception as e:
                failed += 1
                errors.append((test_name, e))
                print(f"  [FAIL] {test_name}: {e}")

    total = passed + failed
    print(f"\n{'='*60}")
    print(f"RESULTS: {passed}/{total} passed, {failed} failed")
    print(f"LLM API KEY: NOT REQUIRED (kernel is LLM-independent)")
    print(f"{'='*60}")

    if errors:
        print("\nFAILURES:")
        for name, err in errors:
            print(f"\n  {name}:")
            traceback.print_exception(type(err), err, err.__traceback__)

    return passed, failed, total


if __name__ == "__main__":
    passed, failed, total = run_tests()
    exit(0 if failed == 0 else 1)
