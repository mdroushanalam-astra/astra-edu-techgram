from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Tuple, List
import math
from ..epistemics import LearningEnvelope

@dataclass
class ReviewRecord:
    timestamp: datetime
    quality: int

class RetentionModel:
    """Spaced Repetition (SM-2) + Ebbinghaus forgetting curve implementation."""
    
    def sm2_schedule(self, history: List[ReviewRecord]) -> Tuple[int, float]:
        """Implements the SM-2 algorithm exactly. Wozniak (1990)."""
        easiness = 2.5
        interval = 1
        repetition = 0
        
        for record in history:
            q = record.quality
            if q >= 3:
                if repetition == 0:
                    interval = 1
                elif repetition == 1:
                    interval = 6
                else:
                    interval = int(round(interval * easiness))
                repetition += 1
            else:
                repetition = 0
                interval = 1
                
            easiness = max(1.3, easiness + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
            
        return interval, easiness

    def ebbinghaus_retention(self, days_since_review: float, stability: float = 14.0) -> float:
        """Ebbinghaus forgetting curve. Ebbinghaus (1885)."""
        return math.exp(-days_since_review / stability)
        
    def predict_retention(self, last_review: datetime, stability: float = 14.0) -> float:
        """Predict current retention."""
        days = (datetime.utcnow() - last_review).total_seconds() / 86400.0
        return self.ebbinghaus_retention(days, stability)
        
    def next_optimal_review(self, last_review: datetime, stability: float, target_retention: float = 0.85) -> datetime:
        """Solve for when retention drops to target."""
        days = -stability * math.log(target_retention)
        return last_review + timedelta(days=days)
        
    def to_envelope(self, retention_prob: float, last_review: datetime, stability: float, model_version: str = 'sm2_v1') -> LearningEnvelope:
        """Return a LearningEnvelope."""
        return LearningEnvelope(
            value=retention_prob,
            unit="probability",
            knowledge_type="predicted",
            observation_basis="retention_model",
            observed_at=datetime.now(),
            valid_until=last_review + timedelta(days=stability),
            decay_model="ebbinghaus",
            decay_halflife_days=stability,
            confidence=0.8,
            sample_size=10,
            uncertainty=0.1,
            value_semantics="estimate",
            model_id="sm2_v1",
            model_version=model_version
        )
