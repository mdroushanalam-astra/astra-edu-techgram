from dataclasses import dataclass
from typing import Optional, List, Tuple, Union, Any
import math
from datetime import datetime

from ..epistemics import LearningEnvelope

@dataclass
class ItemParams:
    item_id: str
    difficulty: float
    discrimination: float
    topic: str
    subtopic: Optional[str] = None
    guessing: float = 0.0             # c parameter (default 0 for 2PL, >0 for 3PL)

class IRTModel:
    """
    Item Response Theory (IRT) 2PL & 3PL Logistic model implementation. Lord (1952), Birnbaum (1968).
    
    P(theta) = c + (1 - c) / (1 + exp(-a * (theta - b)))
    where:
      b = difficulty
      a = discrimination
      c = pseudo-guessing parameter
    """
    
    def probability(self, ability: float, item: ItemParams) -> float:
        """Probability of correct response under 2PL or 3PL model."""
        c = getattr(item, "guessing", 0.0) or getattr(item, "guessing_parameter", 0.0)
        a = item.discrimination
        b = item.difficulty
        
        # Logistic core
        exponent = -a * (ability - b)
        # Avoid overflow in exp
        if exponent > 30.0:
            p_star = 0.0
        elif exponent < -30.0:
            p_star = 1.0
        else:
            p_star = 1.0 / (1.0 + math.exp(exponent))
            
        return c + (1.0 - c) * p_star
        
    def item_information(self, ability: float, item: ItemParams) -> float:
        """
        Fisher Information Function for an item at ability level theta.
        I(theta) = a^2 * (P - c)^2 * Q / ((1 - c)^2 * P)
        For 2PL (c=0), this simplifies to: a^2 * P * (1 - P)
        """
        c = getattr(item, "guessing", 0.0) or getattr(item, "guessing_parameter", 0.0)
        a = item.discrimination
        p = self.probability(ability, item)
        q = 1.0 - p
        
        if p <= c or p >= 1.0:
            return 0.0
            
        if c == 0.0:
            return (a ** 2) * p * q
        else:
            p_star = (p - c) / (1.0 - c)
            return (a ** 2) * (q / p) * (p_star ** 2)
        
    def estimate_ability(
        self,
        responses: List[Tuple[Any, bool]],
        prior_ability: float = 0.0
    ) -> Tuple[float, float]:
        """
        Maximum Likelihood Estimation (MLE) with bounded Newton-Raphson
        and Fisher Information standard error calculation.
        """
        if not responses:
            return prior_ability, 1.0
            
        ability = prior_ability
        iterations = 25
        
        for _ in range(iterations):
            gradient = 0.0
            info = 0.0
            for item, is_correct in responses:
                p = self.probability(ability, item)
                q = 1.0 - p
                a = item.discrimination
                c = getattr(item, "guessing", 0.0) or getattr(item, "guessing_parameter", 0.0)
                
                # First derivative of log-likelihood
                if p > c and p < 1.0:
                    p_star = (p - c) / (1.0 - c) if c < 1.0 else p
                    # Weight factor
                    w = (a * p_star) / p if p > 0 else a
                    gradient += (float(is_correct) - p) * w
                    info += self.item_information(ability, item)
                
            if info <= 0.001:
                break
                
            delta = gradient / info
            # Step size damping for stability
            delta = max(-1.0, min(1.0, delta))
            ability += delta
            
            # Guard ability scale within reasonable psychological bounds [-4.0, +4.0]
            ability = max(-4.0, min(4.0, ability))
            
            if abs(delta) < 0.005:
                break
                
        info_total = sum(self.item_information(ability, item) for item, _ in responses)
        se = 1.0 / math.sqrt(info_total) if info_total > 0.01 else 1.0
        se = min(2.0, max(0.1, se))
        
        return round(ability, 4), round(se, 4)
        
    def select_items(
        self,
        ability: float,
        items: List[Any],
        n: int = 5,
        target_info: Optional[float] = None
    ) -> List[Any]:
        """
        Active assessment item selection: selects n items that maximize Fisher Information
        at the current estimated ability level theta.
        """
        item_info = []
        for item in items:
            info = self.item_information(ability, item)
            item_info.append((info, item))
            
        item_info.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in item_info[:n]]
        
    def to_envelope(
        self,
        ability: float,
        se: float,
        n_items: int,
        model_version: str = 'irt_3pl_v1'
    ) -> LearningEnvelope:
        """Returns a verified LearningEnvelope carrying IRT ability estimate and standard error."""
        return LearningEnvelope(
            value=ability,
            unit="score",
            knowledge_type="predicted",
            observation_basis="item_response_pattern",
            observed_at=datetime.now(),
            confidence=max(0.1, min(1.0, 1.0 / (1.0 + se))),
            sample_size=n_items,
            uncertainty=se,
            value_semantics="estimate",
            model_id="irt_model",
            model_version=model_version
        )
