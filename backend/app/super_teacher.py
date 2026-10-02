"""
Super Teacher Pedagogical Generation & Execution Layer.

CRITICAL ARCHITECTURAL BOUNDARY:
- The Epistemic Intelligence Kernel decides WHAT to teach, WHY to teach it,
  WHAT pedagogical action to apply, and WHAT root causes to address.
- Super Teacher translates that deterministic TeachingBrief into high-leverage,
  Socratic, structured instructional prompts, dialogues, and explanations.
- Super Teacher NEVER computes mastery, NEVER alters the learning envelope,
  and NEVER overrides scheduler interventions.
"""

from typing import Dict, List, Optional, Any
from .session_engine import TeachingBrief

class SuperTeacher:
    """
    Teacher Orchestrator responsible for generating instruction prompts,
    Socratic responses, and synthesis summaries from a TeachingBrief.
    """
    
    SYSTEM_DIRECTIVE = (
        "You are the Astra Super Teacher — an expert pedagogical communicator for high-stakes exams (e.g. UPSC CSE). "
        "You adhere strictly to the cognitive dimension and pedagogical action dictated by the intelligence kernel. "
        "You NEVER lecture passively. You use first-principles breakdowns, real-world grounding, or Socratic reframing "
        "based on the brief. You address root causes directly."
    )

    @staticmethod
    def construct_instructional_prompt(brief: TeachingBrief, dialog_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Builds a structured prompt package for LLM generation adhering to kernel constraints.
        """
        prompt_template = {
            "system_prompt": SuperTeacher.SYSTEM_DIRECTIVE,
            "target_topic": brief.topic,
            "subject": brief.subject,
            "learning_objective": brief.target_learning_objective,
            "pedagogical_action": brief.pedagogical_action,
            "cognitive_dimension": brief.cognitive_dimension,
            "root_cause_deficit": brief.root_cause_deficit,
            "starter_seed": brief.suggested_starter_prompt,
            "dialogue_history": dialog_history or []
        }

        # Context-dependent behavioral instructions
        instructions = []
        if brief.pedagogical_action == "socratic_misconception_reframe":
            instructions.append(
                "Present a counter-intuitive scenario or question highlighting the gap between apparent recall and real understanding. "
                "Do NOT give away the answer immediately; lead the student to detect their own contradiction."
            )
        elif brief.pedagogical_action == "transfer_bridge":
            instructions.append(
                "The student has memorized theoretical facts. Ground the concept in an unscripted, complex real-world case study. "
                "Ask how the theoretical mechanism operates under these specific dynamic conditions."
            )
        elif brief.pedagogical_action == "investigation_probe":
            instructions.append(
                "The kernel has detected elevated epistemic uncertainty or contradictory response patterns. "
                "Pose a targeted diagnostic question to isolate whether the student struggles with core definition or application."
            )
        elif brief.pedagogical_action == "first_principles_derivation":
            instructions.append(
                "Derive this concept step-by-step from fundamental physical or constitutional laws without skipping logical links."
            )

        if brief.root_cause_deficit:
            instructions.append(
                f"ATTENTION: A foundational prerequisite deficit was identified in '{brief.root_cause_deficit}'. "
                f"Explicitly connect '{brief.topic}' back to '{brief.root_cause_deficit}' before advancing."
            )

        prompt_template["pedagogical_instructions"] = instructions
        return prompt_template

    @staticmethod
    def generate_opening_dialogue(brief: TeachingBrief) -> str:
        """
        Deterministic fallback opening turn if no external LLM API key is connected.
        Ensures end-to-end functionality in offline/airgapped testing environments.
        """
        if brief.pedagogical_action == "transfer_bridge":
            return (
                f"Hello! I see you've got strong command over the core definitions of {brief.topic}. "
                f"Let's put that to the test in a real-world scenario: How would this mechanism behave under "
                f"extreme seasonal shifts or non-standard conditions?"
            )
        elif brief.pedagogical_action == "socratic_misconception_reframe":
            return (
                f"Welcome! Let's examine {brief.topic} from a different angle today. "
                f"Consider this scenario: If pressure differences create wind, why don't winds blow directly from high to low pressure across the globe? "
                f"What fundamental force is altering the path?"
            )
        elif brief.root_cause_deficit:
            return (
                f"Before we tackle {brief.topic}, let's look at its foundational pillar: {brief.root_cause_deficit}. "
                f"If we master the core intuition of {brief.root_cause_deficit}, {brief.topic} becomes completely straightforward. "
                f"Let's start with: {brief.suggested_starter_prompt}"
            )
        else:
            return brief.suggested_starter_prompt or f"Let's begin our session on {brief.topic}. What is your first-principles understanding of this concept?"
