from dataclasses import dataclass
from typing import List, Optional, Any

from ..student_state import StudentState
from ..epistemics import LearningEnvelope

@dataclass
class SessionBlock:
    topic: str
    subject: str
    session_type: str         # "learn" | "practice" | "revise" | "assess" | "investigate_probe" | "prerequisite_remediation"
    duration_min: int
    difficulty: float
    reason: str
    priority_score: float
    probe_type: Optional[str] = None          # When session_type is investigate_probe
    root_cause_target: Optional[str] = None   # When session_type is prerequisite_remediation

    def to_dict(self) -> dict:
        return {
            "topic": self.topic,
            "subject": self.subject,
            "session_type": self.session_type,
            "duration_min": self.duration_min,
            "difficulty": self.difficulty,
            "reason": self.reason,
            "priority_score": self.priority_score,
            "probe_type": self.probe_type,
            "root_cause_target": self.root_cause_target
        }

class SchedulerEngine:
    """
    Epistemically-Grounded Policy & Scheduler Engine with Prerequisite Traversal.
    
    CORE INVARIANTS:
    1. High Uncertainty / Discrepancy -> Information-Gathering Investigation Probe.
    2. Prerequisite Bottleneck -> Shifts intervention to ancestor root-cause concept
       instead of continuing futile surface drills on the advanced node!
    """
    def generate_schedule(
        self,
        student_state: StudentState,
        knowledge_graph: Optional[Any] = None,
        n_blocks: int = 5,
        block_duration: int = 40
    ) -> List[SessionBlock]:
        topics = list(student_state._topic_masteries.values())
        if not topics:
            return []

        scored_topics = []
        for tm in topics:
            mastery_val = tm.mastery.value if tm.mastery and tm.mastery.value is not None else 0.5
            retention_val = tm.retention.value if tm.retention and tm.retention.value is not None else 1.0
            
            # Extract epistemic flags from vector
            has_discrepancy = len(tm.vector.model_discrepancies) > 0
            high_uncertainty = tm.vector.has_high_uncertainty
            max_unc = tm.vector.max_uncertainty
            
            # Policy weights
            w1, w2, w3, w4, w5 = 0.30, 0.25, 0.20, 0.15, 0.10
            weakness_score = 1.0 - mastery_val

            # Priority elevates topics needing epistemic resolution
            priority = (
                w1 * (1.0 - retention_val) +
                w2 * weakness_score +
                w3 * 0.5 +  # Goal urgency baseline
                w4 * 0.5 -  # Variety baseline
                w5 * 0.1    # Fatigue penalty
            )
            
            # Epistemic bonus: information-seeking takes precedence when models clash
            if has_discrepancy or high_uncertainty:
                priority += 0.35 * max_unc

            # Prerequisite Bottleneck bonus: fixing foundational blockers takes top priority
            if knowledge_graph is not None:
                bottleneck = knowledge_graph.diagnose_bottleneck(tm.topic, student_state._topic_masteries)
                if bottleneck is not None:
                    priority += 0.40

            scored_topics.append((priority, tm))

        # Sort by priority descending
        scored_topics.sort(key=lambda x: x[0], reverse=True)

        schedule: List[SessionBlock] = []
        consecutive_subject_count = 0
        last_subject = None
        has_revision = False
        has_new_concept = False

        for priority, tm in scored_topics:
            if len(schedule) >= n_blocks:
                break
            
            # 1. Check Prerequisite Bottleneck via Knowledge Graph
            if knowledge_graph is not None:
                bottleneck = knowledge_graph.diagnose_bottleneck(tm.topic, student_state._topic_masteries)
                if bottleneck is not None:
                    # Reroute intervention from advanced surface topic to foundational root cause
                    root_id = bottleneck["root_cause_concept_id"]
                    root_name = bottleneck["root_cause_name"]
                    reason = f"PREREQUISITE BOTTLENECK: {bottleneck['diagnosis_reason']}"
                    block = SessionBlock(
                        topic=root_id,
                        subject=tm.subject,
                        session_type="prerequisite_remediation",
                        duration_min=block_duration,
                        difficulty=0.45,
                        reason=reason,
                        priority_score=priority + 0.15,
                        root_cause_target=tm.topic
                    )
                    schedule.append(block)
                    last_subject = tm.subject
                    consecutive_subject_count += 1
                    continue

            # 2. Check if this topic requires an information-gathering probe
            if tm.vector.has_high_uncertainty or tm.vector.recommended_probe_type:
                session_type = "investigate_probe"
                probe_target = tm.vector.recommended_probe_type or "epistemic_probe"
                reason = f"UNCERTAINTY PROBE: {'; '.join(tm.vector.model_discrepancies) or tm.vector.primary_uncertainty or 'High epistemic uncertainty'}"
                block = SessionBlock(
                    topic=tm.topic,
                    subject=tm.subject,
                    session_type=session_type,
                    duration_min=block_duration,
                    difficulty=0.50, # Neutral diagnostic difficulty
                    reason=reason,
                    priority_score=priority,
                    probe_type=probe_target
                )
                schedule.append(block)
                last_subject = tm.subject
                consecutive_subject_count += 1
                continue

            mastery_val = tm.mastery.value if tm.mastery and tm.mastery.value is not None else 0.0
            
            if mastery_val < 0.3:
                session_type = "learn"
            elif mastery_val < 0.6:
                session_type = "practice"
            elif mastery_val < 0.8:
                session_type = "revise"
            else:
                session_type = "assess"

            # Max 2 consecutive same-subject blocks
            if tm.subject == last_subject:
                if consecutive_subject_count >= 2:
                    continue
            else:
                consecutive_subject_count = 0

            slots_left = n_blocks - len(schedule)
            
            # Ensure at least 1 revision and 1 new concept block if there are more than 2 total blocks and candidate pool permits
            if n_blocks > 2 and slots_left == 1:
                if not has_revision and session_type != "revise" and any(t.mastery.value and 0.6 <= t.mastery.value < 0.8 for _, t in scored_topics):
                    continue
                if not has_new_concept and session_type != "learn" and any(t.mastery.value and t.mastery.value < 0.3 for _, t in scored_topics):
                    continue

            reason = f"Priority {priority:.2f}, Mastery {mastery_val:.2f}, Retention {tm.retention.value if tm.retention and tm.retention.value is not None else 1.0:.2f}"
            
            block = SessionBlock(
                topic=tm.topic,
                subject=tm.subject,
                session_type=session_type,
                duration_min=block_duration,
                difficulty=1.0 - mastery_val,
                reason=reason,
                priority_score=priority
            )
            
            schedule.append(block)
            
            last_subject = tm.subject
            consecutive_subject_count += 1
            if session_type == "revise":
                has_revision = True
            if session_type == "learn":
                has_new_concept = True

        return schedule
