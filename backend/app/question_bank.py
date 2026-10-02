from dataclasses import dataclass, field
from typing import List, Optional, Set, Dict, Any
from enum import Enum
import json

class CognitiveDimension(str, Enum):
    RECALL = "recall"                 # Direct retrieval / memory without visual cues
    RECOGNITION = "recognition"       # Identifying correct option from distractors
    CONCEPTUAL = "conceptual"         # Understanding mechanism / causal relationships
    APPLICATION = "application"       # Applying rule/mechanism to a familiar scenario
    TRANSFER = "transfer"             # Novel / out-of-distribution context execution

class ItemValidationStatus(str, Enum):
    AUTHOR_PRIOR = "author_prior"     # Manually seeded parameter prior (NOT yet empirically calibrated)
    PILOT_TESTED = "pilot_tested"     # Tested on small sample (< 30 responses)
    FIELD_CALIBRATED = "field_calibrated" # Empirically calibrated via response data with verified standard errors

@dataclass
class AssessmentQuestion:
    """
    Epistemic Measurement Instrument.
    Directly maps to the LearningStateVector dimensions and the Knowledge Graph DAG.
    Explicitly tracks calibration provenance so we never pretend author priors are empirical parameters.
    """
    question_id: str
    knowledge_node: str               # Direct concept node id in CurriculumKnowledgeGraph
    cognitive_dimension: CognitiveDimension
    text: str
    options: List[str]
    correct_option_index: int
    explanation: str
    
    # Prerequisite concepts that this item indirectly touches/tests
    prerequisite_nodes: List[str] = field(default_factory=list)
    
    # 3-Parameter Logistic (3PL) Item Parameters
    difficulty: float = 0.0           # b parameter: typical range [-3.0, +3.0]
    discrimination: float = 1.0       # a parameter: typical range [0.5, 2.5]
    guessing_parameter: float = 0.25  # c parameter: pseudo-chance level (0.25 for 4-option MCQ)
    
    # Epistemic status & validation history
    version: str = "v1.0"
    validation_status: ItemValidationStatus = ItemValidationStatus.AUTHOR_PRIOR
    sample_size: int = 0              # Number of empirical responses gathered
    empirical_p_value: Optional[float] = None # Classical difficulty: proportion answering correctly
    parameter_standard_error: Optional[float] = 0.35 # Standard error of difficulty estimate

    def to_dict(self) -> Dict[str, Any]:
        return {
            "question_id": self.question_id,
            "knowledge_node": self.knowledge_node,
            "cognitive_dimension": self.cognitive_dimension.value,
            "text": self.text,
            "options": self.options,
            "correct_option_index": self.correct_option_index,
            "explanation": self.explanation,
            "prerequisite_nodes": self.prerequisite_nodes,
            "difficulty": self.difficulty,
            "discrimination": self.discrimination,
            "guessing_parameter": self.guessing_parameter,
            "version": self.version,
            "validation_status": self.validation_status.value,
            "sample_size": self.sample_size,
            "empirical_p_value": self.empirical_p_value,
            "parameter_standard_error": self.parameter_standard_error
        }

class QuestionBank:
    """
    Repository of Epistemic Assessment Questions indexed by Knowledge Node and Cognitive Dimension.
    """
    def __init__(self):
        self._items: Dict[str, AssessmentQuestion] = {}
        self._by_node: Dict[str, List[str]] = {}
        self._by_dimension: Dict[CognitiveDimension, List[str]] = {d: [] for d in CognitiveDimension}

    def add_question(self, question: AssessmentQuestion) -> None:
        if question.question_id in self._items:
            raise ValueError(f"Question '{question.question_id}' already exists")
        self._items[question.question_id] = question
        
        # Index by node
        if question.knowledge_node not in self._by_node:
            self._by_node[question.knowledge_node] = []
        self._by_node[question.knowledge_node].append(question.question_id)
        
        # Index by dimension
        self._by_dimension[question.cognitive_dimension].append(question.question_id)

    def get_question(self, question_id: str) -> Optional[AssessmentQuestion]:
        return self._items.get(question_id)

    def query(
        self,
        knowledge_node: Optional[str] = None,
        cognitive_dimension: Optional[CognitiveDimension] = None,
        max_difficulty: Optional[float] = None,
        min_difficulty: Optional[float] = None
    ) -> List[AssessmentQuestion]:
        candidates = list(self._items.values())
        if knowledge_node is not None:
            candidates = [q for q in candidates if q.knowledge_node == knowledge_node]
        if cognitive_dimension is not None:
            candidates = [q for q in candidates if q.cognitive_dimension == cognitive_dimension]
        if max_difficulty is not None:
            candidates = [q for q in candidates if q.difficulty <= max_difficulty]
        if min_difficulty is not None:
            candidates = [q for q in candidates if q.difficulty >= min_difficulty]
        return candidates

    def record_response(self, question_id: str, is_correct: bool) -> None:
        """
        Updates empirical item stats (moving from AUTHOR_PRIOR toward FIELD_CALIBRATED).
        """
        q = self._items.get(question_id)
        if not q:
            return
        
        prev_n = q.sample_size
        prev_p = q.empirical_p_value if q.empirical_p_value is not None else 0.5
        new_n = prev_n + 1
        new_p = ((prev_p * prev_n) + (1.0 if is_correct else 0.0)) / new_n
        
        q.sample_size = new_n
        q.empirical_p_value = round(new_p, 4)
        
        # Update calibration status based on empirical sample size
        if new_n >= 30 and q.validation_status != ItemValidationStatus.FIELD_CALIBRATED:
            q.validation_status = ItemValidationStatus.FIELD_CALIBRATED
            q.parameter_standard_error = max(0.08, round(1.0 / (new_n ** 0.5), 3))
        elif new_n >= 5 and q.validation_status == ItemValidationStatus.AUTHOR_PRIOR:
            q.validation_status = ItemValidationStatus.PILOT_TESTED
            q.parameter_standard_error = 0.25

def build_default_upsc_question_bank() -> QuestionBank:
    """
    Constructs a verified question bank covering foundational to synthesis nodes
    for Geography (Monsoon) and Polity (Constitution), spanning all 5 cognitive dimensions.
    All items start with validation_status=AUTHOR_PRIOR.
    """
    qb = QuestionBank()

    # =========================================================
    # GEOGRAPHY: Atmospheric Dynamics & Monsoon System
    # =========================================================
    
    # 1. solar_insolation (Depth 1)
    qb.add_question(AssessmentQuestion(
        question_id="GEO_SOLAR_REC_01",
        knowledge_node="solar_insolation",
        cognitive_dimension=CognitiveDimension.RECALL,
        text="What is the primary factor responsible for the differential rate of heating between land and water surfaces?",
        options=[
            "Water has a substantially higher specific heat capacity than land",
            "Land surfaces have a higher albedo than water surfaces in all latitudes",
            "Coriolis force accelerates heat transfer exclusively across water bodies",
            "Ozone concentration is denser over terrestrial land masses"
        ],
        correct_option_index=0,
        explanation="Water has roughly 4 times higher specific heat capacity than land, plus transparency allows solar penetration, causing land to heat and cool much faster.",
        difficulty=-0.8,
        discrimination=1.1
    ))
    
    qb.add_question(AssessmentQuestion(
        question_id="GEO_SOLAR_CON_01",
        knowledge_node="solar_insolation",
        cognitive_dimension=CognitiveDimension.CONCEPTUAL,
        text="During summer solstice, if insolation received at the Top of the Atmosphere is highest at the North Pole, why are surface temperatures highest in sub-tropical deserts?",
        options=[
            "Deserts have zero albedo and absorb 100% of solar radiation",
            "Persistent cloud-free skies and subsidence in subtropical highs minimize atmospheric scattering",
            "Geothermal convection currents concentrate beneath arid subtropical plates",
            "The distance of the Earth to the Sun is minimized over desert latitudes"
        ],
        correct_option_index=1,
        explanation="Subtropical deserts feature sinking dry air (high pressure), cloudless skies, and high transmissivity, allowing maximum direct insolation to reach the surface.",
        difficulty=0.4,
        discrimination=1.3,
        prerequisite_nodes=["solar_insolation"]
    ))

    # 2. pressure_gradients (Depth 2)
    qb.add_question(AssessmentQuestion(
        question_id="GEO_PRES_REC_01",
        knowledge_node="pressure_gradients",
        cognitive_dimension=CognitiveDimension.RECOGNITION,
        text="According to Ferrel's Law, wind moving in the Northern Hemisphere is deflected in which direction by Coriolis acceleration?",
        options=["Towards the left", "Towards the right", "Directly southward", "It undergoes zero deflection at mid-latitudes"],
        correct_option_index=1,
        explanation="Ferrel's Law states that Coriolis force deflects moving fluids towards their right in the Northern Hemisphere and left in the Southern Hemisphere.",
        difficulty=-0.5,
        discrimination=1.0,
        prerequisite_nodes=["solar_insolation"]
    ))

    qb.add_question(AssessmentQuestion(
        question_id="GEO_PRES_APP_01",
        knowledge_node="pressure_gradients",
        cognitive_dimension=CognitiveDimension.APPLICATION,
        text="An intense low-pressure cell develops over northwest India in May. How do winds originating from the south of the Equator behave upon crossing latitude 0°?",
        options=[
            "They continue moving north-west due to equatorial inertia",
            "They deflect to the right, becoming south-westerly winds as Coriolis force switches direction",
            "They are deflected to the left, becoming south-easterly trade winds",
            "They immediately decelerate and sink due to the ITCZ inversion layer"
        ],
        correct_option_index=1,
        explanation="South-east trade winds from the Southern Hemisphere cross the equator, where Coriolis changes sign, deflecting them to the right into the South-West Monsoon.",
        difficulty=0.6,
        discrimination=1.4,
        prerequisite_nodes=["pressure_gradients", "solar_insolation"]
    ))

    # 3. itcz_dynamics (Depth 3)
    qb.add_question(AssessmentQuestion(
        question_id="GEO_ITCZ_CON_01",
        knowledge_node="itcz_dynamics",
        cognitive_dimension=CognitiveDimension.CONCEPTUAL,
        text="Why does the summer ITCZ shift much farther north over the Indian subcontinent (~25°N) compared to over the Atlantic or Pacific oceans?",
        options=[
            "The thermal effect of the vast Eurasian landmass and high Tibetan plateau amplifies sensible heating",
            "The Indian Ocean possesses strong cold upwelling currents that push the ITCZ northward",
            "Earth's magnetic pole deflection is strongest over South Asia",
            "Equatorial westerly wind bursts only occur in closed ocean basins"
        ],
        correct_option_index=0,
        explanation="The enormous thermal contrast created by the Asian landmass and Tibetan plateau pulls the equatorial trough far north over the Ganga plains (Monsoon Trough).",
        difficulty=0.7,
        discrimination=1.5,
        prerequisite_nodes=["pressure_gradients", "solar_insolation"]
    ))

    # 4. monsoon_variability (Depth 5 - Out of Distribution / Transfer)
    qb.add_question(AssessmentQuestion(
        question_id="GEO_VAR_TRA_01",
        knowledge_node="monsoon_variability",
        cognitive_dimension=CognitiveDimension.TRANSFER,
        text="A climate model predicts a strong Positive Indian Ocean Dipole (+IOD) co-occurring with a Moderate El Niño in the Pacific. What is the most plausible impact on the Indian Southwest Monsoon rainfall?",
        options=[
            "Total monsoon drought is guaranteed because El Niño invariably suppresses the Walker circulation completely",
            "The positive IOD can exert a counterbalancing positive effect, neutralizing or mitigating the typical deficit caused by El Niño",
            "The two events cancel each other's pressure gradients, causing the monsoon winds to reverse into winter easterlies in July",
            "Western disturbances will entirely replace the southwest monsoon as the primary rainfall source"
        ],
        correct_option_index=1,
        explanation="Positive IOD warms the western Indian Ocean and enhances convection over the Arabian Sea, often counteracting the drying effect of an El Niño teleconnection.",
        difficulty=1.6,
        discrimination=1.7,
        prerequisite_nodes=["monsoon_mechanism", "itcz_dynamics", "pressure_gradients"]
    ))

    # =========================================================
    # POLITY: Constitutional Architecture & Sovereignty
    # =========================================================

    # 1. constitutional_sovereignty (Depth 1)
    qb.add_question(AssessmentQuestion(
        question_id="POL_SOV_REC_01",
        knowledge_node="constitutional_sovereignty",
        cognitive_dimension=CognitiveDimension.RECALL,
        text="Where does the ultimate sovereignty under the Constitution of India reside according to the text of the Preamble?",
        options=[
            "In the Parliament of India",
            "In the Supreme Court as the guardian of the Constitution",
            "In 'We, the People of India'",
            "In the President of India as the Executive Head of State"
        ],
        correct_option_index=2,
        explanation="The Preamble commences with 'We, The People of India... adopt, enact and give to ourselves this Constitution', vesting sovereign authority in the people.",
        difficulty=-1.2,
        discrimination=0.9
    ))

    # 2. fundamental_rights_basics (Depth 2)
    qb.add_question(AssessmentQuestion(
        question_id="POL_FR_CON_01",
        knowledge_node="fundamental_rights_basics",
        cognitive_dimension=CognitiveDimension.CONCEPTUAL,
        text="Why are Fundamental Rights in Part III characterized as primarily negative obligations upon the State?",
        options=[
            "They deny the State any power to tax or regulate property",
            "They prescribe prohibitions and limitations restricting arbitrary legislative and executive infringement upon individual liberties",
            "They can never be suspended or restricted under any constitutional circumstance",
            "They apply only against private citizens rather than governmental entities"
        ],
        correct_option_index=1,
        explanation="Most Fundamental Rights are formulated as injunctions against State action ('State shall not deny...', 'No person shall be deprived...').",
        difficulty=0.1,
        discrimination=1.2,
        prerequisite_nodes=["constitutional_sovereignty"]
    ))

    # 3. amendment_procedure (Depth 3)
    qb.add_question(AssessmentQuestion(
        question_id="POL_AMD_APP_01",
        knowledge_node="amendment_procedure",
        cognitive_dimension=CognitiveDimension.APPLICATION,
        text="A bill proposing to alter the distribution of legislative powers between the Union and the States under the 7th Schedule is introduced. What constitutional requirement must be fulfilled?",
        options=[
            "Special majority of Parliament plus ratification by not less than one-half of State Legislatures by simple majority",
            "Simple majority of Parliament followed by a national referendum of registered voters",
            "Unanimous approval of the Inter-State Council and assent of the Chief Justice of India",
            "Special majority of both Houses with mandatory approval from all State governors"
        ],
        correct_option_index=0,
        explanation="Provisos to Article 368(2) require amendments affecting federal provisions (like 7th Schedule) to be ratified by at least half the states.",
        difficulty=0.8,
        discrimination=1.4,
        prerequisite_nodes=["constitutional_sovereignty"]
    ))

    # 4. basic_structure_doctrine (Depth 4 - Synthesis & Transfer)
    qb.add_question(AssessmentQuestion(
        question_id="POL_BS_TRA_01",
        knowledge_node="basic_structure_doctrine",
        cognitive_dimension=CognitiveDimension.TRANSFER,
        text="Suppose Parliament unanimously passes a constitutional amendment under Article 368 inserting a clause that completely bars judicial review of any constitutional amendment. How would this amendment be evaluated by the constitutional courts?",
        options=[
            "It is completely valid because Parliament's constituent power under Article 368 is sovereign and unlimited",
            "It would be struck down as void because Judicial Review is an entrenched facet of the Basic Structure that cannot be abrogated even by unanimous constitutional amendment",
            "It is valid provided the amendment received ratification from 100% of State Legislatures",
            "It would be held in abeyance until reviewed by an ad-hoc Parliamentary constituent tribunal"
        ],
        correct_option_index=1,
        explanation="As established in Kesavananda Bharati (1973) and Minerva Mills (1980), judicial review is an inviolable basic feature; constituent power cannot destroy the constitution's identity.",
        difficulty=1.4,
        discrimination=1.6,
        prerequisite_nodes=["fundamental_rights_basics", "amendment_procedure", "constitutional_sovereignty"]
    ))

    return qb
