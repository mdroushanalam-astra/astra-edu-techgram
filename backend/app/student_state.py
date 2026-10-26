from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid

from .epistemics import LearningEnvelope

@dataclass
class LearningStateVector:
    """
    Multidimensional representation of learning on a specific topic.
    Replaces the reductive scalar 'mastery: float'.
    Captures the cognitive depth from passive recognition to independent transfer,
    and explicitly tracks model disagreements and epistemic state.
    """
    recall: LearningEnvelope            # Active retrieval capacity (e.g., flashcard/prompt without options)
    recognition: LearningEnvelope       # Discriminative capacity (e.g., standard multiple-choice recognition)
    conceptual: LearningEnvelope        # Qualitative explanation / mechanism grasp
    application: LearningEnvelope       # Problem solving in familiar context
    transfer: LearningEnvelope          # Cross-domain / novel context execution
    retention: Optional[LearningEnvelope] = None # Temporal persistence projection
    fluency: Optional[LearningEnvelope] = None   # Latency / automaticity of response
    
    # Preserved Disagreement & Information-Seeking State
    model_discrepancies: List[str] = field(default_factory=list)
    primary_uncertainty: Optional[str] = None
    recommended_probe_type: Optional[str] = None  # e.g., "diagnostic_transfer", "calibration_probe", "retrieval_check"

    def composite_index(self) -> float:
        """
        Calculates expected proficiency index weighted across dimensions.
        Safely accounts for unknown values.
        """
        weights = {
            "recall": 0.25,
            "recognition": 0.15,
            "conceptual": 0.20,
            "application": 0.25,
            "transfer": 0.15
        }
        total_weight = 0.0
        weighted_sum = 0.0

        for dim, w in weights.items():
            env = getattr(self, dim, None)
            if env and env.value is not None and env.knowledge_type != "unknown":
                weighted_sum += float(env.value) * w
                total_weight += w

        return (weighted_sum / total_weight) if total_weight > 0 else 0.0

    @property
    def max_uncertainty(self) -> float:
        """Returns the maximum uncertainty across active (known) dimension envelopes."""
        envs = [self.recall, self.recognition, self.conceptual, self.application, self.transfer]
        known_uncs = [e.uncertainty for e in envs if e is not None and e.knowledge_type != "unknown"]
        return max(known_uncs, default=0.1)

    @property
    def has_high_uncertainty(self) -> bool:
        """Flags whether epistemic uncertainty exceeds decision thresholds (>= 0.35) or discrepancies exist."""
        return bool(self.model_discrepancies or self.max_uncertainty >= 0.35)

    def to_dict(self) -> dict:
        return {
            "recall": self.recall.to_dict(),
            "recognition": self.recognition.to_dict(),
            "conceptual": self.conceptual.to_dict(),
            "application": self.application.to_dict(),
            "transfer": self.transfer.to_dict(),
            "retention": self.retention.to_dict() if self.retention else None,
            "fluency": self.fluency.to_dict() if self.fluency else None,
            "composite_index": round(self.composite_index(), 4),
            "model_discrepancies": self.model_discrepancies,
            "primary_uncertainty": self.primary_uncertainty,
            "recommended_probe_type": self.recommended_probe_type,
            "has_high_uncertainty": self.has_high_uncertainty
        }

@dataclass
class TopicMastery:
    topic: str
    subject: str
    vector: LearningStateVector
    last_reviewed: Optional[datetime] = None
    review_count: int = 0
    
    @property
    def mastery(self) -> LearningEnvelope:
        """
        Backward-compatible envelope projection synthesizing the vector composite.
        Preserves model uncertainty rather than collapsing it.
        """
        c_val = self.vector.composite_index()
        # Find minimum confidence among known dimensions
        conf = 0.5
        confs = [getattr(self.vector, d).confidence for d in ["recall", "recognition", "conceptual", "application", "transfer"]
                 if getattr(self.vector, d).knowledge_type != "unknown"]
        if confs:
            conf = min(confs)

        unc = self.vector.max_uncertainty

        return LearningEnvelope(
            value=c_val,
            unit="probability",
            knowledge_type="computed",
            observation_basis="state_fusion",
            observed_at=self.vector.recognition.observed_at,
            confidence=conf,
            sample_size=self.review_count,
            uncertainty=unc,
            value_semantics="estimate"
        )

    @property
    def retention(self) -> Optional[LearningEnvelope]:
        return self.vector.retention

    @retention.setter
    def retention(self, val: Optional[LearningEnvelope]):
        self.vector.retention = val

    def to_dict(self) -> dict:
        return {
            "topic": self.topic,
            "subject": self.subject,
            "vector": self.vector.to_dict(),
            "mastery": self.mastery.to_dict(),
            "retention": self.retention.to_dict() if self.retention else None,
            "last_reviewed": self.last_reviewed.isoformat() if self.last_reviewed else None,
            "review_count": self.review_count
        }

class StudentState:
    def __init__(self, student_id: uuid.UUID):
        self.student_id = student_id
        self._topic_masteries: Dict[str, TopicMastery] = {}
        # Competing hypotheses distribution (Belief State)
        self._belief_distributions: Dict[str, Dict[str, float]] = {
            "session_incompletion_reasons": {
                "schedule_mismatch": 0.25,
                "content_difficulty": 0.25,
                "low_motivation": 0.20,
                "external_interruption": 0.20,
                "unknown": 0.10
            },
            "performance_anomaly_explanations": {
                "guessing_lucky": 0.25,
                "careless_slip": 0.25,
                "knowledge_asymmetry": 0.25,
                "unknown": 0.25
            }
        }
        # Domain data stores
        self._behavioral_data: Dict[str, LearningEnvelope] = {}
        self._metacognitive_data: Dict[str, LearningEnvelope] = {}
        self._skill_data: Dict[str, LearningEnvelope] = {}
        self._goal_data: Dict[str, LearningEnvelope] = {}
        self._engagement_data: Dict[str, LearningEnvelope] = {}
        self._context_data: Dict[str, LearningEnvelope] = {}
        self._uncertainty_data: Dict[str, LearningEnvelope] = {}

    def cognitive_state(self) -> dict:
        return {
            "topic_masteries": {k: v.to_dict() for k, v in self._topic_masteries.items()},
            "concept_mastery": {},
            "misconceptions": {}
        }
    
    def behavioral_state(self) -> dict:
        return {k: (v.to_dict() if hasattr(v, "to_dict") else v) for k, v in self._behavioral_data.items()}

    def metacognitive_state(self) -> dict:
        return {k: (v.to_dict() if hasattr(v, "to_dict") else v) for k, v in self._metacognitive_data.items()}
    
    def skill_state(self) -> dict:
        return {k: (v.to_dict() if hasattr(v, "to_dict") else v) for k, v in self._skill_data.items()}
    
    def goal_state(self) -> dict:
        return {k: (v.to_dict() if hasattr(v, "to_dict") else v) for k, v in self._goal_data.items()}

    def engagement_state(self) -> dict:
        return {k: (v.to_dict() if hasattr(v, "to_dict") else v) for k, v in self._engagement_data.items()}
    
    def context_state(self) -> dict:
        return {k: (v.to_dict() if hasattr(v, "to_dict") else v) for k, v in self._context_data.items()}
    
    def uncertainty_state(self) -> dict:
        return {k: (v.to_dict() if hasattr(v, "to_dict") else v) for k, v in self._uncertainty_data.items()}

    def belief_state(self) -> dict:
        return self._belief_distributions

    def update_belief_distribution(self, dimension: str, distribution: Dict[str, float]) -> None:
        total = sum(distribution.values())
        if total > 0 and abs(total - 1.0) > 0.001:
            distribution = {k: v / total for k, v in distribution.items()}
        self._belief_distributions[dimension] = distribution
    
    def full_state(self) -> dict:
        return {
            "student_id": str(self.student_id),
            "cognitive": self.cognitive_state(),
            "behavioral": self.behavioral_state(),
            "metacognitive": self.metacognitive_state(),
            "skill": self.skill_state(),
            "goal": self.goal_state(),
            "engagement": self.engagement_state(),
            "context": self.context_state(),
            "uncertainty": self.uncertainty_state(),
            "belief": self.belief_state()
        }

    def update_topic_vector(self, topic: str, subject: str, vector: LearningStateVector) -> None:
        if topic in self._topic_masteries:
            self._topic_masteries[topic].vector = vector
            self._topic_masteries[topic].subject = subject
        else:
            self._topic_masteries[topic] = TopicMastery(
                topic=topic,
                subject=subject,
                vector=vector
            )

    def update_mastery(self, topic: str, subject: str, new_mastery_envelope: LearningEnvelope) -> None:
        """
        Helper method allowing assignment of a basic assessment envelope,
        distributing it across vector dimensions appropriately.
        """
        vector = LearningStateVector(
            recall=new_mastery_envelope,
            recognition=new_mastery_envelope,
            conceptual=new_mastery_envelope,
            application=new_mastery_envelope,
            transfer=LearningEnvelope.unknown("probability", "Not yet assessed across transfer contexts")
        )
        self.update_topic_vector(topic, subject, vector)

    def get_weakest_topics(self, n: int = 5) -> List[TopicMastery]:
        known = [tm for tm in self._topic_masteries.values() if tm.mastery.value is not None]
        known.sort(key=lambda tm: tm.mastery.value)
        return known[:n]

    def get_decaying_topics(self, threshold: float = 0.7) -> List[TopicMastery]:
        decaying = []
        for tm in self._topic_masteries.values():
            if tm.retention and tm.retention.value is not None:
                if tm.retention.value < threshold:
                    decaying.append(tm)
        return decaying

    def to_dict(self) -> dict:
        return self.full_state()
