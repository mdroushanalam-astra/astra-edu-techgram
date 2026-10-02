from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid

@dataclass
class TeachingBrief:
    """
    Structured Teaching Brief passed from Kernel to the Teaching Layer.
    
    CRITICAL ARCHITECTURAL BOUNDARY:
    The Kernel decides:
    - What topic to teach
    - What pedagogical strategy to employ (e.g., Socratic reframing, counterexample, first-principles derivation)
    - What cognitive dimension is targeted (e.g., Conceptual understanding vs Application)
    - What root cause to address (if prerequisite deficit was diagnosed)
    
    The Teaching Layer / LLM strictly executes this brief and CANNOT alter
    mastery, diagnosis, or intervention priorities.
    """
    topic: str
    subject: str
    target_learning_objective: str
    pedagogical_action: str       # "first_principles_derivation" | "socratic_misconception_reframe" | "transfer_bridge" | "retrieval_drill"
    cognitive_dimension: str      # "conceptual" | "application" | "transfer" | "recall"
    root_cause_deficit: Optional[str] = None
    student_difficulty_profile: str = "intermediate"
    recommended_duration_min: int = 40
    suggested_starter_prompt: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "topic": self.topic,
            "subject": self.subject,
            "target_learning_objective": self.target_learning_objective,
            "pedagogical_action": self.pedagogical_action,
            "cognitive_dimension": self.cognitive_dimension,
            "root_cause_deficit": self.root_cause_deficit,
            "student_difficulty_profile": self.student_difficulty_profile,
            "recommended_duration_min": self.recommended_duration_min,
            "suggested_starter_prompt": self.suggested_starter_prompt
        }

class LearningSessionEngine:
    """
    Session State Machine & Pedagogical Coordinator.
    
    Manages the live learning session cycle:
    1. start_session: Queries scheduler & knowledge graph -> emits TeachingBrief.
    2. log_interaction: Records student/teacher turns immutably in session log.
    3. transition_phase: Moves from 'instruction' -> 'interaction' -> 'assessment' -> 'completed'.
    4. complete_session: Triggers assessment pipeline -> updates student model.
    """
    def __init__(self, scheduler_engine, knowledge_graph, question_bank):
        self.scheduler = scheduler_engine
        self.knowledge_graph = knowledge_graph
        self.question_bank = question_bank

    def create_teaching_brief(
        self,
        student_state,
        topic: Optional[str] = None,
        subject: Optional[str] = None
    ) -> TeachingBrief:
        """
        Synthesizes student state, model discrepancies, and prerequisite graph
        to generate an exact, non-hallucinatory TeachingBrief.
        """
        # If no explicit topic passed, let the deterministic scheduler select the optimal topic
        if not topic:
            schedule = self.scheduler.generate_schedule(student_state, knowledge_graph=self.knowledge_graph, n_blocks=1)
            if schedule:
                top_block = schedule[0]
                topic = top_block.topic
                subject = top_block.subject
                session_type = top_block.session_type
                root_cause = top_block.root_cause_target
            else:
                topic = "solar_insolation"
                subject = "Geography"
                session_type = "learn"
                root_cause = None
        else:
            session_type = "practice"
            root_cause = None

        # Inspect topic vector to identify exact cognitive dimension gap
        tm = student_state._topic_masteries.get(topic)
        dimension = "conceptual"
        action = "first_principles_derivation"
        starter = f"Welcome to our session on {topic}. Let's explore the foundational mechanisms."

        if tm and tm.vector:
            vec = tm.vector
            if any("HIGH_RECALL_LOW_TRANSFER" in d for d in vec.model_discrepancies):
                dimension = "transfer"
                action = "transfer_bridge"
                starter = f"You've shown strong factual recall on {topic}, but let's see how it applies in a completely new, real-world case."
            elif any("SEVERE_OVERCONFIDENCE" in d for d in vec.model_discrepancies):
                dimension = "conceptual"
                action = "socratic_misconception_reframe"
                starter = f"Let's test our foundational intuition about {topic} through a counter-intuitive paradox."
            elif vec.has_high_uncertainty:
                dimension = "recognition"
                action = "investigation_probe"
                starter = f"We have some conflicting evidence regarding your mastery of {topic}. Let's clarify the key concepts together."

        # Check knowledge node description
        node = self.knowledge_graph.nodes.get(topic)
        objective = node.description if node else f"Master core competencies of {topic}"

        return TeachingBrief(
            topic=topic,
            subject=subject or "General",
            target_learning_objective=objective,
            pedagogical_action=action,
            cognitive_dimension=dimension,
            root_cause_deficit=root_cause,
            suggested_starter_prompt=starter
        )
