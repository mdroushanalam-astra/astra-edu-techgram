from dataclasses import dataclass
from typing import List
from ..epistemics import LearningEnvelope

@dataclass
class BKTParams:
    """Parameters for Bayesian Knowledge Tracing."""
    p_init: float = 0.3
    p_transit: float = 0.1
    p_guess: float = 0.2
    p_slip: float = 0.1

class BKTModel:
    """
    Bayesian Knowledge Tracing (BKT) implementation based on Corbett & Anderson (1994).
    """
    def __init__(self, params: BKTParams | None = None):
        self.params = params or BKTParams()
        
    def update(self, p_learned: float, is_correct: bool) -> float:
        """
        Single Bayesian update step.
        """
        p_guess = self.params.p_guess
        p_slip = self.params.p_slip
        p_transit = self.params.p_transit
        
        if is_correct:
            p_obs = (p_learned * (1 - p_slip)) / (p_learned * (1 - p_slip) + (1 - p_learned) * p_guess)
        else:
            p_obs = (p_learned * p_slip) / (p_learned * p_slip + (1 - p_learned) * (1 - p_guess))
            
        p_learned_new = p_obs + (1 - p_obs) * p_transit
        return p_learned_new
        
    def predict_correct(self, p_learned: float) -> float:
        """Predict probability of correct response."""
        return p_learned * (1 - self.params.p_slip) + (1 - p_learned) * self.params.p_guess
        
    def trace(self, responses: List[bool]) -> List[float]:
        """Run BKT over sequence of responses."""
        trace = []
        p_learned = self.params.p_init
        for is_correct in responses:
            p_learned = self.update(p_learned, is_correct)
            trace.append(p_learned)
        return trace
        
    def to_envelope(self, p_learned: float, sample_size: int, model_version: str = 'bkt_v1') -> LearningEnvelope:
        """Return a LearningEnvelope."""
        import datetime
        return LearningEnvelope(
            value=p_learned,
            unit="probability",
            knowledge_type="predicted",
            observation_basis="item_response_pattern",
            observed_at=datetime.datetime.now(),
            confidence=min(1.0, max(0.1, sample_size / 10.0)),
            sample_size=sample_size,
            uncertainty=max(0.01, 1.0 - min(1.0, sample_size / 10.0)),
            value_semantics="estimate",
            model_id="bkt_v1",
            model_version=model_version
        )
