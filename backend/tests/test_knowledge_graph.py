"""
Tests for CurriculumKnowledgeGraph and Root-Cause Bottleneck Traversal
"""

import sys
import os
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.knowledge_graph import build_default_upsc_graph, ConceptNode
from app.student_state import StudentState
from app.engines.reconciliation import StateReconciliationEngine
from app.engines.scheduler import SchedulerEngine

def test_prerequisite_traversal_and_bottleneck_rerouting():
    graph = build_default_upsc_graph()
    sid = uuid.uuid4()
    state = StudentState(student_id=sid)

    # Student is attempting advanced synthesis: 'monsoon_variability' (depth 5)
    # But two levels below, 'solar_insolation' (depth 1) is solid (0.90),
    # while 'pressure_gradients' (depth 2) is broken (mastery = 0.32)!
    
    vec_foundation = StateReconciliationEngine.reconcile_topic(
        topic="solar_insolation", subject="Geography",
        bkt_mastery=0.90, irt_ability=1.8, transfer_score=0.88, observed_responses_count=20
    )
    vec_broken_prereq = StateReconciliationEngine.reconcile_topic(
        topic="pressure_gradients", subject="Geography",
        bkt_mastery=0.32, irt_ability=-1.2, transfer_score=0.25, observed_responses_count=15
    )
    vec_advanced = StateReconciliationEngine.reconcile_topic(
        topic="monsoon_variability", subject="Geography",
        bkt_mastery=0.40, irt_ability=-0.8, transfer_score=0.30, observed_responses_count=12
    )

    state.update_topic_vector("solar_insolation", "Geography", vec_foundation)
    state.update_topic_vector("pressure_gradients", "Geography", vec_broken_prereq)
    state.update_topic_vector("monsoon_variability", "Geography", vec_advanced)

    # 1. Test direct bottleneck diagnosis
    bottleneck = graph.diagnose_bottleneck("monsoon_variability", state._topic_masteries)
    assert bottleneck is not None, "Failed to diagnose prerequisite bottleneck"
    assert bottleneck["root_cause_concept_id"] == "pressure_gradients"
    assert "unresolved foundational deficit in prerequisite" in bottleneck["diagnosis_reason"]

    # 2. Test Scheduler reroutes intervention to the root-cause concept
    scheduler = SchedulerEngine()
    schedule = scheduler.generate_schedule(state, knowledge_graph=graph, n_blocks=2, block_duration=40)

    # The scheduler MUST NOT prescribe futile drills on monsoon_variability;
    # it must target 'pressure_gradients' with 'prerequisite_remediation'!
    assert schedule[0].topic == "pressure_gradients"
    assert schedule[0].session_type == "prerequisite_remediation"
    assert schedule[0].root_cause_target == "monsoon_variability"
    assert "PREREQUISITE BOTTLENECK" in schedule[0].reason

    print("  [PASS] Prerequisite graph correctly isolated root-cause deficit and rerouted intervention.")

if __name__ == "__main__":
    test_prerequisite_traversal_and_bottleneck_rerouting()
