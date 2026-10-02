from datetime import datetime
from typing import Dict, Any, Optional, List
import math

from ..epistemics import LearningEnvelope
from ..student_state import StudentState, LearningStateVector

class StateReconciliationEngine:
    """
    Belief Reconciliation & State Fusion Engine.
    Fuses disparate model outputs (BKT P(Learned), IRT theta, SM-2 retention decay, 
    behavioral observations, confidence reports, and transfer evaluations).
    
    CRITICAL INVARIANT:
    Preserves disagreements instead of collapsing/averaging them away!
    When models clash (e.g. BKT high, IRT low) or cognitive dimensions diverge
    (e.g. high recall, low transfer; or high confidence, low correctness),
    it widens uncertainty, records the explicit discrepancy, and assigns an
    information-seeking probe type rather than pretending certainty.
    """
    
    @staticmethod
    def reconcile_topic(
        topic: str,
        subject: str,
        bkt_mastery: Optional[float] = None,
        irt_ability: Optional[float] = None,
        retention_decay: Optional[float] = None,
        self_report_confidence: Optional[float] = None,
        transfer_score: Optional[float] = None,
        observed_responses_count: int = 0,
        recent_correct_rate: Optional[float] = None,
        easy_correct_rate: Optional[float] = None,
        hard_correct_rate: Optional[float] = None
    ) -> LearningStateVector:
        now = datetime.now()
        discrepancies: List[str] = []
        primary_uncertainties: List[str] = []
        recommended_probe: Optional[str] = None
        
        # 1. Map IRT ability to [0, 1] probability scale
        irt_prob = 1.0 / (1.0 + math.exp(-irt_ability)) if irt_ability is not None else None
        
        # 2. Check Model Dissonance: BKT vs IRT
        model_dissonance = False
        if bkt_mastery is not None and irt_prob is not None:
            diff = bkt_mastery - irt_prob
            if abs(diff) >= 0.30:
                model_dissonance = True
                discrepancies.append(f"IRT_BKT_DISSONANCE: BKT={bkt_mastery:.2f} vs IRT_prob={irt_prob:.2f} (diff={diff:+.2f})")
                primary_uncertainties.append("BKT indicates mastery but IRT indicates discriminative failure (possible guessing or rote item memorization)")
                recommended_probe = "diagnostic_probe"
                
        # 3. Check Pathological Anomaly: Inverted Difficulty (Easy Wrong, Hard Right)
        inverted_difficulty = False
        if easy_correct_rate is not None and hard_correct_rate is not None:
            if hard_correct_rate > (easy_correct_rate + 0.35):
                inverted_difficulty = True
                discrepancies.append(f"INVERTED_DIFFICULTY_ANOMALY: Hard={hard_correct_rate:.2f} vs Easy={easy_correct_rate:.2f}")
                primary_uncertainties.append("Student failing easy questions but passing hard questions (suspicion of guessing or answer-pattern gaming)")
                recommended_probe = "verification_probe"

        # 4. Check Metacognitive Calibration Discrepancy (Confidence vs Correctness)
        metacognitive_misaligned = False
        if self_report_confidence is not None:
            eval_rate = recent_correct_rate if recent_correct_rate is not None else (irt_prob if irt_prob is not None else bkt_mastery)
            if eval_rate is not None:
                cal_diff = self_report_confidence - eval_rate
                if cal_diff >= 0.40:
                    metacognitive_misaligned = True
                    discrepancies.append(f"SEVERE_OVERCONFIDENCE: Reported={self_report_confidence:.2f} vs Actual={eval_rate:.2f}")
                    primary_uncertainties.append("Severe overconfidence: learner unaware of conceptual blindspots")
                    recommended_probe = "calibration_probe"
                elif cal_diff <= -0.40:
                    metacognitive_misaligned = True
                    discrepancies.append(f"SEVERE_UNDERCONFIDENCE: Reported={self_report_confidence:.2f} vs Actual={eval_rate:.2f}")
                    primary_uncertainties.append("Severe underconfidence: learner executing correctly but lacks subjective self-efficacy")
                    recommended_probe = "confidence_validation_probe"

        # 5. Base Confidences & Uncertainty Calculations
        base_confidence = 0.85 if observed_responses_count >= 15 else (0.65 if observed_responses_count >= 5 else 0.40)
        
        # WIDEN UNCERTAINTY when contradictory evidence exists
        added_uncertainty = 0.0
        if model_dissonance:
            added_uncertainty += 0.20
        if inverted_difficulty:
            added_uncertainty += 0.25
        if metacognitive_misaligned:
            added_uncertainty += 0.15

        # Recognition uncertainty:
        recog_val = bkt_mastery if bkt_mastery is not None else (irt_prob if irt_prob is not None else 0.5)
        recog_unc = min(0.95, (1.0 - base_confidence) + added_uncertainty)
        recog_conf = max(0.05, 1.0 - recog_unc)

        recognition_env = LearningEnvelope(
            value=round(recog_val, 4),
            unit="probability",
            knowledge_type="computed",
            observation_basis="state_fusion",
            observed_at=now,
            confidence=round(recog_conf, 3),
            sample_size=observed_responses_count,
            uncertainty=round(recog_unc, 3),
            value_semantics="estimate",
            model_id="fusion_v2"
        )

        # Recall:
        recall_val = recog_val * (retention_decay if retention_decay is not None else 0.9)
        recall_unc = min(0.95, recog_unc + 0.05)
        recall_conf = max(0.05, 1.0 - recall_unc)

        recall_env = LearningEnvelope(
            value=round(recall_val, 4),
            unit="probability",
            knowledge_type="computed",
            observation_basis="state_fusion",
            observed_at=now,
            confidence=round(recall_conf, 3),
            sample_size=observed_responses_count,
            uncertainty=round(recall_unc, 3),
            value_semantics="estimate",
            model_id="fusion_v2"
        )

        # Conceptual Understanding:
        concept_val = min(recog_val, irt_prob if irt_prob is not None else recog_val)
        concept_unc = min(0.95, recog_unc + 0.10)
        concept_conf = max(0.05, 1.0 - concept_unc)

        conceptual_env = LearningEnvelope(
            value=round(concept_val, 4),
            unit="probability",
            knowledge_type="inferred",
            observation_basis="state_fusion",
            observed_at=now,
            confidence=round(concept_conf, 3),
            sample_size=observed_responses_count,
            uncertainty=round(concept_unc, 3),
            value_semantics="estimate",
            model_id="fusion_v2"
        )

        # Application:
        app_val = irt_prob if irt_prob is not None else (bkt_mastery * 0.80 if bkt_mastery is not None else 0.5)
        app_unc = min(0.95, recog_unc + 0.08)
        app_conf = max(0.05, 1.0 - app_unc)

        application_env = LearningEnvelope(
            value=round(app_val, 4),
            unit="probability",
            knowledge_type="computed",
            observation_basis="state_fusion",
            observed_at=now,
            confidence=round(app_conf, 3),
            sample_size=observed_responses_count,
            uncertainty=round(app_unc, 3),
            value_semantics="estimate",
            model_id="fusion_v2"
        )

        # Transfer (Out of Distribution execution):
        if transfer_score is not None:
            # Check for Recall-Transfer Disconnect (high recall, low transfer)
            if recall_val >= 0.75 and transfer_score <= 0.35:
                discrepancies.append(f"HIGH_RECALL_LOW_TRANSFER: Recall={recall_val:.2f} vs Transfer={transfer_score:.2f}")
                primary_uncertainties.append("Rote retrieval capacity does not transfer to novel problem solving contexts")
                if not recommended_probe:
                    recommended_probe = "transfer_remediation_probe"
                    
            transfer_env = LearningEnvelope(
                value=round(transfer_score, 4),
                unit="probability",
                knowledge_type="assessed",
                observation_basis="diagnostic",
                observed_at=now,
                confidence=0.85,
                sample_size=observed_responses_count,
                uncertainty=0.15,
                value_semantics="exact",
                model_id="transfer_v1"
            )
        else:
            # If recall is high but transfer is unknown, record the hypothesis and recommend probe
            if recall_val >= 0.70:
                primary_uncertainties.append("Strong recall detected but transfer capability unmeasured")
                if not recommended_probe:
                    recommended_probe = "diagnostic_transfer"
            transfer_env = LearningEnvelope.unknown("probability", "Awaiting out-of-distribution transfer assessment")

        # Retention Envelope:
        retention_env = None
        if retention_decay is not None:
            retention_env = LearningEnvelope(
                value=round(retention_decay, 4),
                unit="probability",
                knowledge_type="predicted",
                observation_basis="retention_model",
                observed_at=now,
                confidence=0.80,
                sample_size=observed_responses_count,
                uncertainty=0.20,
                value_semantics="estimate",
                model_id="sm2_v1"
            )

        # Assemble Primary Uncertainty summary string if any
        primary_unc_summary = "; ".join(primary_uncertainties) if primary_uncertainties else None

        return LearningStateVector(
            recall=recall_env,
            recognition=recognition_env,
            conceptual=conceptual_env,
            application=application_env,
            transfer=transfer_env,
            retention=retention_env,
            model_discrepancies=discrepancies,
            primary_uncertainty=primary_unc_summary,
            recommended_probe_type=recommended_probe
        )
