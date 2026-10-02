from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
import json

@dataclass
class ConceptNode:
    concept_id: str
    name: str
    subject: str
    description: str
    prerequisites: Set[str] = field(default_factory=set)  # concept_ids that must be understood first
    depth_level: int = 1                                  # 1=foundational, 2=intermediate, 3=advanced/synthesis

    def to_dict(self) -> dict:
        return {
            "concept_id": self.concept_id,
            "name": self.name,
            "subject": self.subject,
            "description": self.description,
            "prerequisites": list(self.prerequisites),
            "depth_level": self.depth_level
        }

class CurriculumKnowledgeGraph:
    """
    Curriculum DAG (Directed Acyclic Graph) for Prerequisite Reasoning.
    
    CRITICAL INVARIANT:
    Enables Root-Cause Learning Bottleneck Diagnosis:
    When a student fails or shows high uncertainty on an advanced concept
    (e.g., 'Monsoon Variability' or 'Basic Structure Doctrine'),
    the system DOES NOT just prescribe more drill on that surface node.
    It traverses the prerequisite dependency graph downward to inspect
    ancestor concept states and isolate the true underlying root-cause blockage.
    """
    def __init__(self):
        self.nodes: Dict[str, ConceptNode] = {}
        # Reverse mapping: prerequisite -> dependent concepts
        self._dependents: Dict[str, Set[str]] = {}

    def add_concept(self, node: ConceptNode) -> None:
        if node.concept_id in self.nodes:
            raise ValueError(f"Concept '{node.concept_id}' already exists in Knowledge Graph")
        self.nodes[node.concept_id] = node
        if node.concept_id not in self._dependents:
            self._dependents[node.concept_id] = set()
        
        for prereq in node.prerequisites:
            if prereq not in self._dependents:
                self._dependents[prereq] = set()
            self._dependents[prereq].add(node.concept_id)

    def get_prerequisites(self, concept_id: str) -> Set[str]:
        """Returns direct prerequisites for a concept."""
        if concept_id not in self.nodes:
            return set()
        return self.nodes[concept_id].prerequisites

    def get_all_ancestor_prerequisites(self, concept_id: str) -> List[str]:
        """
        Topological / BFS traversal of all recursive prerequisites down to foundational roots.
        Returns ordered list from deepest foundation to immediate prerequisite.
        """
        visited = set()
        ordered_ancestors = []

        def dfs(curr_id: str):
            if curr_id in visited:
                return
            visited.add(curr_id)
            if curr_id in self.nodes:
                for p in sorted(self.nodes[curr_id].prerequisites):
                    dfs(p)
                    if p not in ordered_ancestors:
                        ordered_ancestors.append(p)

        dfs(concept_id)
        return ordered_ancestors

    def diagnose_bottleneck(
        self,
        concept_id: str,
        student_topic_masteries: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Inspects the ancestor prerequisite chain against the student's actual mastery vector.
        Finds the deepest ancestor prerequisite with low mastery (< 0.50) or high uncertainty.
        
        Returns:
            Dict describing the root cause, or None if all prerequisites are sound.
        """
        ancestors = self.get_all_ancestor_prerequisites(concept_id)
        if not ancestors:
            return None

        # 1. First scan for confirmed low-mastery deficits (val < 0.55)
        for anc_id in ancestors:
            if anc_id in student_topic_masteries:
                tm = student_topic_masteries[anc_id]
                val = tm.mastery.value if tm.mastery and tm.mastery.value is not None else 0.0
                unc = tm.mastery.uncertainty if tm.mastery else 1.0
                
                if val < 0.55:
                    anc_node = self.nodes.get(anc_id)
                    return {
                        "root_cause_concept_id": anc_id,
                        "root_cause_name": anc_node.name if anc_node else anc_id,
                        "depth_difference": (self.nodes[concept_id].depth_level - anc_node.depth_level) if anc_node and concept_id in self.nodes else 1,
                        "ancestor_mastery": val,
                        "ancestor_uncertainty": unc,
                        "diagnosis_reason": f"Failure on '{concept_id}' is driven by unresolved foundational deficit in prerequisite '{anc_node.name if anc_node else anc_id}' (Mastery: {val:.2f}, Uncertainty: {unc:.2f})"
                    }
                    
        # 2. Second scan for unassessed / high-uncertainty prerequisites (unc >= 0.75 and val < 0.70)
        for anc_id in ancestors:
            if anc_id in student_topic_masteries:
                tm = student_topic_masteries[anc_id]
                val = tm.mastery.value if tm.mastery and tm.mastery.value is not None else 0.0
                unc = tm.mastery.uncertainty if tm.mastery else 1.0
                if unc >= 0.75 and val < 0.70:
                    anc_node = self.nodes.get(anc_id)
                    return {
                        "root_cause_concept_id": anc_id,
                        "root_cause_name": anc_node.name if anc_node else anc_id,
                        "depth_difference": (self.nodes[concept_id].depth_level - anc_node.depth_level) if anc_node and concept_id in self.nodes else 1,
                        "ancestor_mastery": val,
                        "ancestor_uncertainty": unc,
                        "diagnosis_reason": f"Failure on '{concept_id}' is driven by high uncertainty on foundational prerequisite '{anc_node.name if anc_node else anc_id}' (Mastery: {val:.2f}, Uncertainty: {unc:.2f})"
                    }

        return None

def build_default_upsc_graph() -> CurriculumKnowledgeGraph:
    """
    Constructs a foundational UPSC curriculum DAG covering Geography (Monsoon System)
    and Polity (Constitutional Framework & Amendments).
    """
    graph = CurriculumKnowledgeGraph()

    # --- GEOGRAPHY: Atmospheric Dynamics & Monsoon System ---
    graph.add_concept(ConceptNode(
        concept_id="solar_insolation",
        name="Solar Insolation & Differential Heating",
        subject="Geography",
        description="Foundational thermodynamics of Earth surface and atmospheric heating",
        depth_level=1
    ))

    graph.add_concept(ConceptNode(
        concept_id="pressure_gradients",
        name="Pressure Gradients & Coriolis Force",
        subject="Geography",
        description="Atmospheric pressure belts, global wind patterns, and Coriolis deflection",
        prerequisites={"solar_insolation"},
        depth_level=2
    ))

    graph.add_concept(ConceptNode(
        concept_id="itcz_dynamics",
        name="ITCZ Shifting & Seasonal Jet Streams",
        subject="Geography",
        description="Inter-Tropical Convergence Zone seasonal migration and subtropical jet streams",
        prerequisites={"pressure_gradients"},
        depth_level=3
    ))

    graph.add_concept(ConceptNode(
        concept_id="monsoon_mechanism",
        name="Indian Monsoon Onset & Mechanism",
        subject="Geography",
        description="Southwest monsoon onset, Tibetan heating, and Arabian Sea / Bay of Bengal branches",
        prerequisites={"itcz_dynamics"},
        depth_level=4
    ))

    graph.add_concept(ConceptNode(
        concept_id="monsoon_variability",
        name="Monsoon Variability (ENSO & IOD Dynamics)",
        subject="Geography",
        description="El Niño Southern Oscillation and Indian Ocean Dipole teleconnections",
        prerequisites={"monsoon_mechanism"},
        depth_level=5
    ))

    # --- POLITY: Constitutional Architecture ---
    graph.add_concept(ConceptNode(
        concept_id="constitutional_sovereignty",
        name="Constitutional Sovereignty & Supremacy",
        subject="Polity",
        description="Foundational source of constitutional authority and legal order",
        depth_level=1
    ))

    graph.add_concept(ConceptNode(
        concept_id="fundamental_rights_basics",
        name="Fundamental Rights Core Framework (Part III)",
        subject="Polity",
        description="Civil liberties, Article 14, 19, 21 guarantees and judicial enforceability",
        prerequisites={"constitutional_sovereignty"},
        depth_level=2
    ))

    graph.add_concept(ConceptNode(
        concept_id="dpsp_framework",
        name="Directive Principles of State Policy (Part IV)",
        subject="Polity",
        description="Non-justiciable socio-economic principles and relationship with Part III",
        prerequisites={"fundamental_rights_basics"},
        depth_level=3
    ))

    graph.add_concept(ConceptNode(
        concept_id="amendment_procedure",
        name="Constitutional Amendment Procedure (Article 368)",
        subject="Polity",
        description="Parliamentary constituent power, special majorities, and state ratification",
        prerequisites={"constitutional_sovereignty"},
        depth_level=3
    ))

    graph.add_concept(ConceptNode(
        concept_id="basic_structure_doctrine",
        name="Basic Structure Doctrine (Kesavananda Bharati)",
        subject="Polity",
        description="Judicial limits on constitutional amendment power and rule of law preservation",
        prerequisites={"fundamental_rights_basics", "amendment_procedure"},
        depth_level=4
    ))

    return graph
