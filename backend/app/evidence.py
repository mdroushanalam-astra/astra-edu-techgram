from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional, Any
import uuid

@dataclass
class IntelligenceReceipt:
    decision: str
    observations: List[Dict[str, Any]]
    predictions: List[Dict[str, Any]]
    candidate_actions: List[Dict[str, Any]]
    selected_action: Dict[str, Any]
    selection_reason: str
    constraints_checked: List[str]
    confidence: float
    assumptions: List[str]
    unknowns: List[str]
    receipt_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)
    expected_outcome: Optional[Dict[str, Any]] = None
    actual_outcome: Optional[Dict[str, Any]] = None
    prediction_error: Optional[float] = None

    def to_dict(self) -> dict:
        return {
            "receipt_id": self.receipt_id,
            "decision": self.decision,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "observations": self.observations,
            "predictions": self.predictions,
            "candidate_actions": self.candidate_actions,
            "selected_action": self.selected_action,
            "selection_reason": self.selection_reason,
            "constraints_checked": self.constraints_checked,
            "confidence": self.confidence,
            "assumptions": self.assumptions,
            "unknowns": self.unknowns,
            "expected_outcome": self.expected_outcome,
            "actual_outcome": self.actual_outcome,
            "prediction_error": self.prediction_error
        }

class ReceiptStore:
    def __init__(self):
        self._receipts: List[IntelligenceReceipt] = []
        
    def store(self, receipt: IntelligenceReceipt) -> None:
        self._receipts.append(receipt)
        
    def get(self, receipt_id: str) -> Optional[IntelligenceReceipt]:
        for receipt in self._receipts:
            if receipt.receipt_id == receipt_id:
                return receipt
        return None
        
    def get_for_student(self, student_id: str, limit: int = 20) -> List[IntelligenceReceipt]:
        # Simple implementation for V0. Assumes all receipts belong to student or filters manually.
        # In a real database, there'd be a relation or a student_id field.
        return self._receipts[-limit:]
