import uuid
import datetime
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

@dataclass
class StudentEvent:
    event_type: str
    student_id: uuid.UUID
    payload: Dict[str, Any]
    source: str
    event_id: uuid.UUID = field(default_factory=uuid.uuid4)
    timestamp: datetime.datetime = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc))
    session_id: Optional[uuid.UUID] = None

    VALID_EVENT_TYPES = frozenset([
        "assessment_completed", "item_response", "session_started", 
        "session_completed", "session_abandoned", "help_requested", 
        "content_skipped", "confidence_reported", "goal_set", 
        "revision_completed", "login", "schedule_viewed"
    ])

    def __post_init__(self):
        if self.event_type not in self.VALID_EVENT_TYPES:
            raise ValueError(f"Invalid event_type '{self.event_type}'")

    def to_dict(self) -> Dict[str, Any]:
        """Serialize the event to a dictionary."""
        return {
            "event_id": str(self.event_id),
            "student_id": str(self.student_id),
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type,
            "payload": self.payload,
            "source": self.source,
            "session_id": str(self.session_id) if self.session_id else None
        }

class EventStore:
    """An in-memory store for V0 student events."""
    
    def __init__(self):
        self._events: List[StudentEvent] = []

    def emit(self, event: StudentEvent) -> None:
        """Store a new event."""
        self._events.append(event)

    def get_events(self, student_id: uuid.UUID, event_type: Optional[str] = None, since: Optional[datetime.datetime] = None, limit: int = 100) -> List[StudentEvent]:
        """Retrieve events for a given student."""
        result = []
        for event in sorted(self._events, key=lambda e: e.timestamp, reverse=True):
            if event.student_id != student_id:
                continue
            if event_type is not None and event.event_type != event_type:
                continue
            if since is not None and event.timestamp < since:
                continue
            
            result.append(event)
            if len(result) >= limit:
                break
                
        return result
