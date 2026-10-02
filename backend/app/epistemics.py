import datetime
from dataclasses import dataclass, field
from typing import Any, Optional, Dict

@dataclass
class LearningEnvelope:
    """
    The Learning Envelope — wraps every fact and estimate about a student with provenance.
    Cleaned of arbitrary heuristics:
    - No artificial 0.5 confidence caps on self-reports.
    - No forcing sample_size < 10 to 'lower_bound'.
    - Validates knowledge provenance, temporal validity, and non-negative uncertainty.
    """
    value: Any
    unit: str
    knowledge_type: str
    observation_basis: str
    observed_at: datetime.datetime
    valid_until: Optional[datetime.datetime] = None
    decay_model: Optional[str] = None
    decay_halflife_days: Optional[float] = None
    confidence: float = 0.5
    sample_size: int = 0
    uncertainty: float = 0.1
    value_semantics: str = "exact"
    source_trust: float = 1.0
    model_id: Optional[str] = None
    model_version: Optional[str] = None

    VALID_KNOWLEDGE_TYPES = frozenset([
        "assessed", "inferred", "predicted", "self_reported", "computed", "unknown", "decayed"
    ])
    
    VALID_OBSERVATION_BASES = frozenset([
        "mock_test", "session_quiz", "diagnostic", "item_response_pattern",
        "self_declaration", "behavioral_log", "retention_model", "system_default",
        "state_fusion"
    ])

    def __post_init__(self):
        # 1. Null value semantics: forces unknown with 0.0 confidence and maximum uncertainty
        if self.value is None:
            self.knowledge_type = "unknown"
            self.confidence = 0.0
            self.uncertainty = 1.0

        # 2. Knowledge type validity
        if self.knowledge_type not in self.VALID_KNOWLEDGE_TYPES:
            raise ValueError(f"Invalid knowledge_type '{self.knowledge_type}'. Must be one of {self.VALID_KNOWLEDGE_TYPES}")

        # 3. Assessed knowledge requires test-based or response-pattern observation
        if self.knowledge_type == "assessed":
            test_bases = {"mock_test", "session_quiz", "diagnostic", "item_response_pattern"}
            if self.observation_basis not in test_bases:
                raise ValueError(f"Invalid observation_basis '{self.observation_basis}' for knowledge_type 'assessed'")

        # 4. Temporal decay: if expired, mark as decayed and discount confidence proportionally
        if self.valid_until is not None:
            now = datetime.datetime.now(datetime.timezone.utc) if self.valid_until.tzinfo else datetime.datetime.now()
            if now > self.valid_until:
                self.knowledge_type = "decayed"
                self.confidence *= 0.5

        # 5. Model provenance: predicted facts must specify the generator model_id
        if self.knowledge_type == "predicted" and self.model_id is None:
            raise ValueError("model_id is required when knowledge_type is 'predicted'")

        # 6. Epistemic non-negativity
        if self.uncertainty < 0:
            raise ValueError("uncertainty must be non-negative")
            
        # 7. Confidence bounds
        if not (0.0 <= self.confidence <= 1.0):
            raise ValueError("confidence must be between 0.0 and 1.0")

    def to_dict(self) -> Dict[str, Any]:
        """Serialize the envelope to a dictionary."""
        return {
            "value": self.value,
            "unit": self.unit,
            "knowledge_type": self.knowledge_type,
            "observation_basis": self.observation_basis,
            "observed_at": self.observed_at.isoformat() if isinstance(self.observed_at, datetime.datetime) else self.observed_at,
            "valid_until": self.valid_until.isoformat() if isinstance(self.valid_until, datetime.datetime) else self.valid_until,
            "decay_model": self.decay_model,
            "decay_halflife_days": self.decay_halflife_days,
            "confidence": self.confidence,
            "sample_size": self.sample_size,
            "uncertainty": self.uncertainty,
            "value_semantics": self.value_semantics,
            "source_trust": self.source_trust,
            "model_id": self.model_id,
            "model_version": self.model_version
        }

    @staticmethod
    def unknown(unit: str, reason: str) -> "LearningEnvelope":
        """Create an unknown envelope."""
        now = datetime.datetime.now(datetime.timezone.utc)
        return LearningEnvelope(
            value=None,
            unit=unit,
            knowledge_type="unknown",
            observation_basis=reason,
            observed_at=now,
            valid_until=now + datetime.timedelta(days=365),
            decay_model="none",
            decay_halflife_days=0.0,
            confidence=0.0,
            sample_size=0,
            uncertainty=1.0,
            value_semantics="exact",
            source_trust=1.0,
            model_id=None,
            model_version=None
        )
