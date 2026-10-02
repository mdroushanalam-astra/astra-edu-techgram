/**
 * B0 — Polity seed content (UPSC Prelims GS slice).
 * 10 topics · 40 concepts · 80 items with distractor→misconception tags.
 * This is a SEED: the roadmap target is ~500 verified items. Every item here
 * is expert-checked, terse, and tagged so the misconception engine has signal
 * from the very first wrong answer.
 */

import {
  assembleContent,
  type Concept,
  type Content,
  type ExamSpec,
  type Item,
  type Topic,
} from "./content.js";

export const CONTENT_VERSION = "polity-seed-0.1.0";

export const EXAM_SPEC: ExamSpec = {
  questions: 100,
  marksEach: 2,
  negativeFraction: 1 / 3,
  guessFloor: 0.25,
  cutoff: { mean: 85, sd: 6 }, // Prelims GS1 historical cutoffs, marks of 200
  attemptBreakEven: 0.28,
};

const TOPICS: Topic[] = [
  { id: "t_cf", name: "Constitutional Framework", examQuestions: 2 },
  { id: "t_fr", name: "Fundamental Rights", examQuestions: 3 },
  { id: "t_dpsp", name: "Directive Principles", examQuestions: 1.5 },
  { id: "t_fd", name: "Fundamental Duties", examQuestions: 1 },
  { id: "t_ue", name: "Union Executive", examQuestions: 2 },
  { id: "t_parl", name: "Parliament", examQuestions: 2 },
  { id: "t_jud", name: "Judiciary", examQuestions: 2 },
  { id: "t_fed", name: "Federalism", examQuestions: 2 },
  { id: "t_am", name: "Amendments & Basic Structure", examQuestions: 2 },
  { id: "t_bod", name: "Constitutional Bodies", examQuestions: 1.5 },
];

const CONCEPTS: Concept[] = [
  // --- Constitutional Framework ---
  { id: "c_cf_hist", topicId: "t_cf", name: "Historical Background (GoI Acts)", type: "factual", prereqs: [], confusableWith: [] },
  { id: "c_cf_make", topicId: "t_cf", name: "Making of the Constitution", type: "factual", prereqs: [], confusableWith: ["c_cf_hist"] },
  { id: "c_cf_src", topicId: "t_cf", name: "Borrowed Features & Sources", type: "factual", prereqs: [], confusableWith: [] },
  { id: "c_cf_sal", topicId: "t_cf", name: "Salient Features", type: "conceptual", prereqs: ["c_cf_make"], confusableWith: [] },
  // --- Fundamental Rights ---
  { id: "c_fr_14", topicId: "t_fr", name: "Article 14 — Equality", type: "conceptual", prereqs: ["c_cf_sal"], confusableWith: ["c_fr_19"] },
  { id: "c_fr_19", topicId: "t_fr", name: "Article 19 — Freedoms", type: "conceptual", prereqs: ["c_cf_sal"], confusableWith: ["c_fr_21"] },
  { id: "c_fr_21", topicId: "t_fr", name: "Article 21 — Life & Liberty", type: "conceptual", prereqs: ["c_cf_src"], confusableWith: ["c_fr_19"] },
  { id: "c_fr_32", topicId: "t_fr", name: "Article 32 & Writs", type: "conceptual", prereqs: ["c_fr_14"], confusableWith: [] },
  // --- DPSP ---
  { id: "c_dp_nat", topicId: "t_dpsp", name: "Nature of DPSP", type: "conceptual", prereqs: ["c_cf_sal"], confusableWith: ["c_fr_14"] },
  { id: "c_dp_conf", topicId: "t_dpsp", name: "DPSP vs FR Conflict", type: "conceptual", prereqs: ["c_dp_nat", "c_fr_14"], confusableWith: ["c_am_bs"] },
  { id: "c_dp_impl", topicId: "t_dpsp", name: "DPSP Implementations", type: "factual", prereqs: ["c_dp_nat"], confusableWith: [] },
  { id: "c_dp_art", topicId: "t_dpsp", name: "Specific Directives (Art 40–51)", type: "factual", prereqs: ["c_dp_nat"], confusableWith: ["c_dp_impl"] },
  // --- Fundamental Duties ---
  { id: "c_fd_org", topicId: "t_fd", name: "Origin of Duties", type: "factual", prereqs: [], confusableWith: [] },
  { id: "c_fd_list", topicId: "t_fd", name: "The 11 Duties (51A)", type: "factual", prereqs: ["c_fd_org"], confusableWith: [] },
  { id: "c_fd_enf", topicId: "t_fd", name: "Enforceability of Duties", type: "conceptual", prereqs: ["c_fd_org"], confusableWith: ["c_dp_nat"] },
  { id: "c_fd_env", topicId: "t_fd", name: "Duty 51A(g) — Environment", type: "factual", prereqs: ["c_fd_list"], confusableWith: ["c_dp_art"] },
  // --- Union Executive ---
  { id: "c_ue_pres", topicId: "t_ue", name: "President: Election & Impeachment", type: "conceptual", prereqs: ["c_cf_sal"], confusableWith: [] },
  { id: "c_ue_pard", topicId: "t_ue", name: "Pardoning Power (Art 72)", type: "conceptual", prereqs: ["c_ue_pres"], confusableWith: [] },
  { id: "c_ue_pm", topicId: "t_ue", name: "PM & Council of Ministers", type: "conceptual", prereqs: ["c_ue_pres"], confusableWith: [] },
  { id: "c_ue_vp", topicId: "t_ue", name: "Vice-President", type: "factual", prereqs: ["c_ue_pres"], confusableWith: [] },
  // --- Parliament ---
  { id: "c_pl_rs", topicId: "t_parl", name: "Rajya Sabha Special Powers", type: "conceptual", prereqs: ["c_cf_sal"], confusableWith: [] },
  { id: "c_pl_money", topicId: "t_parl", name: "Money Bills", type: "conceptual", prereqs: ["c_pl_rs"], confusableWith: ["c_pl_sess"] },
  { id: "c_pl_sess", topicId: "t_parl", name: "Sessions, Quorum, Joint Sitting", type: "factual", prereqs: [], confusableWith: ["c_pl_money"] },
  { id: "c_pl_comm", topicId: "t_parl", name: "Parliamentary Committees", type: "factual", prereqs: [], confusableWith: [] },
  // --- Judiciary ---
  { id: "c_jd_appt", topicId: "t_jud", name: "Appointment & Collegium", type: "factual", prereqs: [], confusableWith: ["c_am_njac"] },
  { id: "c_jd_rev", topicId: "t_jud", name: "Judicial Review", type: "conceptual", prereqs: ["c_fr_32"], confusableWith: ["c_am_bs"] },
  { id: "c_jd_pil", topicId: "t_jud", name: "PIL & Locus Standi", type: "conceptual", prereqs: ["c_jd_rev"], confusableWith: [] },
  { id: "c_jd_act", topicId: "t_jud", name: "Activism vs Restraint", type: "conceptual", prereqs: ["c_jd_rev"], confusableWith: [] },
  // --- Federalism ---
  { id: "c_fd_nat", topicId: "t_fed", name: "Nature: Quasi-Federal", type: "conceptual", prereqs: ["c_cf_sal"], confusableWith: ["c_fed_rel"] },
  { id: "c_fed_rel", topicId: "t_fed", name: "Legislative Relations (245–254)", type: "conceptual", prereqs: ["c_fd_nat"], confusableWith: [] },
  { id: "c_fed_coun", topicId: "t_fed", name: "Inter-State Machinery (263)", type: "factual", prereqs: ["c_fd_nat"], confusableWith: [] },
  { id: "c_fed_fin", topicId: "t_fed", name: "Financial Relations (280, 275)", type: "conceptual", prereqs: ["c_fd_nat"], confusableWith: ["c_bod_niti"] },
  // --- Amendments ---
  { id: "c_am_proc", topicId: "t_am", name: "Amendment Procedure (368)", type: "conceptual", prereqs: ["c_cf_sal"], confusableWith: [] },
  { id: "c_am_bs", topicId: "t_am", name: "Basic Structure Doctrine", type: "conceptual", prereqs: ["c_am_proc"], confusableWith: ["c_jd_rev"] },
  { id: "c_am_land", topicId: "t_am", name: "Landmark Amendments", type: "factual", prereqs: ["c_am_proc"], confusableWith: [] },
  { id: "c_am_njac", topicId: "t_am", name: "NJAC Case", type: "conceptual", prereqs: ["c_am_bs", "c_jd_appt"], confusableWith: ["c_jd_appt"] },
  // --- Bodies ---
  { id: "c_bd_eci", topicId: "t_bod", name: "Election Commission", type: "factual", prereqs: [], confusableWith: [] },
  { id: "c_bd_cag", topicId: "t_bod", name: "CAG", type: "factual", prereqs: [], confusableWith: ["c_pl_comm"] },
  { id: "c_bd_upsc", topicId: "t_bod", name: "UPSC (315–323)", type: "factual", prereqs: [], confusableWith: [] },
  { id: "c_bod_niti", topicId: "t_bod", name: "NITI Aayog vs Finance Commission", type: "conceptual", prereqs: ["c_fed_fin"], confusableWith: ["c_fed_fin"] },
];

/** [id, conceptId, stem, options, answer, difficulty, expectedTimeSec, dimension, distractorTags] */
type ItemDef = [
  string, string, string, [string, string, string, string], number, number, number,
  Item["dimension"], Record<number, string>?,
];

const ITEMS: ItemDef[] = [
  // cf_hist
  ["i_cf_1", "c_cf_hist", "Which was a feature of the Government of India Act, 1935?",
    ["Dyarchy in the provinces", "Provincial autonomy and a proposed All-India Federation", "Complete independence for India", "Universal adult franchise for the Central Legislature"],
    1, 2, 40, "recall", { 0: "m_goi1919_1935_confusion" }],
  ["i_cf_2", "c_cf_hist", "The Constituent Assembly held its first sitting on—",
    ["26 November 1949", "9 December 1946", "15 August 1947", "26 January 1950"],
    1, 2, 30, "recall", { 0: "m_adopted_vs_enforced" }],
  // cf_make
  ["i_cf_3", "c_cf_make", "The Constitution was ADOPTED by the Constituent Assembly on—",
    ["26 January 1949", "26 November 1949", "15 August 1949", "26 January 1950"],
    1, 2, 30, "recall", { 3: "m_adopted_vs_enforced" }],
  ["i_cf_4", "c_cf_make", "Who chaired the Drafting Committee of the Constitution?",
    ["Dr. Rajendra Prasad", "Dr. B. R. Ambedkar", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel"],
    1, 1, 25, "recall", { 0: "m_drafting_vs_president" }],
  // cf_src
  ["i_cf_5", "c_cf_src", "'Procedure established by law' (Art 21 wording) is borrowed from the constitution of—",
    ["the USA", "Ireland", "Japan", "the United Kingdom"],
    2, 3, 45, "recall", { 0: "m_proc_est_vs_due_process" }],
  ["i_cf_6", "c_cf_src", "Directive Principles of State Policy are borrowed from—",
    ["the USA", "Ireland", "Germany", "Australia"],
    1, 2, 35, "recall", {}],
  // cf_sal
  ["i_cf_7", "c_cf_sal", "Calling the Constitution a 'living document' best refers to—",
    ["its amendment by simple majority", "its blend of rigidity and flexibility in amendment", "its unamendable basic text", "the need for a new Constituent Assembly to change it"],
    1, 3, 50, "conceptual", {}],
  ["i_cf_8", "c_cf_sal", "India is a 'Union of States' chiefly because—",
    ["states delegated powers by agreement and may secede", "the federation was not formed by agreement among states and no state may secede", "states have no autonomy at all", "the USA model was copied verbatim"],
    1, 3, 50, "conceptual", { 0: "m_union_vs_federation" }],
  // fr_14
  ["i_fr_1", "c_fr_14", "Article 14 permits classification between persons only if it is—",
    ["based on executive convenience", "reasonable: founded on intelligible differentia with a rational nexus to the object", "between citizens and non-citizens only", "never permitted in any form"],
    1, 3, 55, "conceptual", {}],
  ["i_fr_2", "c_fr_14", "Equality before the law under Article 14 is available to—",
    ["citizens of India only", "any person, citizen or foreigner", "natural persons only, not companies", "only those aggrieved by the Union"],
    1, 2, 40, "recall", { 0: "m_person_vs_citizen" }],
  // fr_19
  ["i_fr_3", "c_fr_19", "Which is NOT a ground to restrict free speech under Article 19(2)?",
    ["Public order", "Contempt of court", "Administrative convenience of the government", "Defamation"],
    2, 3, 55, "conceptual", { 2: "m_19_2_grounds" }],
  ["i_fr_4", "c_fr_19", "Restrictions on the right to move freely throughout India (19(1)(d)) must be—",
    ["imposed by executive order alone", "imposed by law as reasonable restrictions in the interests of the general public or Scheduled Tribes", "uniform across all states", "approved by the President each time"],
    1, 3, 55, "conceptual", { 0: "m_law_vs_executive" }],
  // fr_21
  ["i_fr_5", "c_fr_21", "After Maneka Gandhi (1978), any 'procedure established by law' depriving life or liberty must be—",
    ["any procedure duly enacted by the legislature", "just, fair and reasonable — importing due process into Article 21", "confined to citizens", "tested only against DPSPs"],
    1, 3, 60, "conceptual", { 0: "m_maneka_any_procedure" }],
  ["i_fr_6", "c_fr_21", "The right to privacy in India is anchored in—",
    ["Article 19(1)(d) — free movement", "Article 21, as authoritatively interpreted in Puttaswamy (2017)", "Article 21A — education", "Article 38 — DPSP"],
    1, 2, 40, "recall", {}],
  // fr_32
  ["i_fr_7", "c_fr_32", "Dr. Ambedkar called which article 'the heart and soul of the Constitution'?",
    ["Article 14", "Article 19", "Article 32", "Article 368"],
    2, 1, 25, "recall", {}],
  ["i_fr_8", "c_fr_32", "A writ of MANDAMUS is issued to—",
    ["produce a detained person before the court", "command a public authority to perform a mandatory public duty", "quash an order already passed", "stop proceedings in a lower court"],
    1, 3, 50, "conceptual", { 0: "m_writ_confusion" }],
  // dp_nat
  ["i_dp_1", "c_dp_nat", "Directive Principles are—",
    ["justiciable like Fundamental Rights", "non-justiciable but fundamental in the governance of the country", "binding obligations on citizens", "enforceable through writs"],
    1, 2, 40, "recall", { 0: "m_dpsp_justiciable" }],
  ["i_dp_2", "c_dp_nat", "Which directive reflects Gandhian principles?",
    ["Uniform civil code", "Organisation of village panchayats (Art 40)", "Separation of judiciary from executive", "Promotion of international peace"],
    1, 3, 45, "recall", {}],
  // dp_conf
  ["i_dp_3", "c_dp_conf", "In Champakam Dorairajan (1951) the Supreme Court held that—",
    ["DPSPs override Fundamental Rights", "in conflict, Fundamental Rights prevail and DPSPs must run subsidiary", "both are equally enforceable", "DPSPs are void ab initio"],
    1, 4, 65, "conceptual", { 0: "m_fr_dpsp_priority_reversed" }],
  ["i_dp_4", "c_dp_conf", "Article 31C (as it survived Kesavananda) shields laws implementing—",
    ["Articles 39(b) and 39(c) from challenge under Articles 14 and 19", "Article 44 from judicial review", "all DPSPs from any challenge", "Article 21A from Article 14"],
    0, 5, 75, "conceptual", {}],
  // dp_impl
  ["i_dp_5", "c_dp_impl", "Which DPSP was implemented through the 73rd Amendment Act, 1992?",
    ["Uniform civil code", "Organisation of village panchayats", "Prohibition of intoxicants", "Equal justice and free legal aid"],
    1, 2, 40, "recall", {}],
  ["i_dp_6", "c_dp_impl", "MGNREGA is most directly an implementation of which directive?",
    ["Article 39(a) — adequate means of livelihood", "Article 41 — right to work", "Article 43 — living wage", "Article 48 — agriculture"],
    1, 3, 50, "conceptual", {}],
  // dp_art
  ["i_dp_7", "c_dp_art", "The directive for a Uniform Civil Code for citizens appears in—",
    ["Article 40", "Article 44", "Article 48", "Article 51"],
    1, 2, 30, "recall", { 2: "m_art44_48_confusion" }],
  ["i_dp_8", "c_dp_art", "Article 48A directs the State to—",
    ["promote cottage industries in rural areas", "protect and improve the environment and safeguard forests and wildlife", "separate the judiciary from the executive", "promote international peace and security"],
    1, 2, 35, "recall", { 2: "m_48a_50_confusion" }],
  // fd_org
  ["i_fd_1", "c_fd_org", "Fundamental Duties were inserted by which amendment?",
    ["44th Amendment, 1978", "42nd Amendment, 1976", "73rd Amendment, 1992", "86th Amendment, 2002"],
    1, 2, 30, "recall", { 0: "m_42nd_44th_confusion" }],
  ["i_fd_2", "c_fd_org", "The idea of Fundamental Duties was borrowed from the constitution of—",
    ["the USA", "Ireland", "the (former) USSR", "Canada"],
    2, 3, 40, "recall", {}],
  // fd_list
  ["i_fd_3", "c_fd_list", "How many Fundamental Duties does Article 51A contain today?",
    ["10", "11", "12", "9"],
    1, 2, 25, "recall", { 0: "m_ten_duties_pre86" }],
  ["i_fd_4", "c_fd_list", "Which duty was added by the 86th Amendment?",
    ["Duty to vote in elections", "Duty of a parent/guardian to provide education opportunities to a child aged 6–14", "Duty to pay taxes", "Duty to serve in the armed forces"],
    1, 3, 40, "recall", {}],
  // fd_enf
  ["i_fd_5", "c_fd_enf", "Fundamental Duties are—",
    ["directly enforceable by writs", "non-justiciable, but courts use them to interpret and uphold statutes", "binding only on the State", "punishable by a dedicated statute"],
    1, 3, 50, "conceptual", {}],
  ["i_fd_6", "c_fd_enf", "The Justice Verma Committee (1999) was constituted to look into—",
    ["review of Fundamental Rights", "operationalisation of Fundamental Duties", "implementation of DPSPs", "electoral reforms"],
    1, 4, 50, "recall", {}],
  // fd_env
  ["i_fd_7", "c_fd_env", "Under Article 51A(g) every citizen has a duty to—",
    ["protect and improve the natural environment, including forests, lakes, rivers and wildlife", "pay taxes promptly", "vote in every election", "provide legal aid to the poor"],
    0, 2, 35, "recall", {}],
  ["i_fd_8", "c_fd_env", "Article 51A duties bind—",
    ["all persons in India", "citizens of India", "only the State", "only public servants"],
    1, 2, 30, "recall", { 0: "m_person_vs_citizen" }],
  // ue_pres
  ["i_ue_1", "c_ue_pres", "The President is elected by—",
    ["elected members of both Houses of Parliament and elected members of State Legislative Assemblies (incl. NCT Delhi and Puducherry)", "all members of Parliament including nominated ones", "Lok Sabha alone", "direct vote of the people"],
    0, 3, 55, "recall", { 1: "m_nominated_in_electorate" }],
  ["i_ue_2", "c_ue_pres", "Impeachment of the President for 'violation of the Constitution' may be initiated in—",
    ["the Lok Sabha only", "either House of Parliament", "the Supreme Court", "a joint sitting of both Houses"],
    1, 3, 50, "recall", { 0: "m_impeachment_house" }],
  // ue_pard
  ["i_ue_3", "c_ue_pard", "The President's pardoning power under Article 72 extends to—",
    ["all cases, including sentences by court-martial and death sentences", "only offences under Union laws, excluding court-martial", "the same class of cases as the Governor under Article 161", "only commutation of death sentences"],
    0, 3, 55, "conceptual", { 2: "m_art72_161_confusion" }],
  ["i_ue_4", "c_ue_pard", "A full pardon under Article 72 has the effect of—",
    ["absolving the convict of the sentence and its disqualifications", "postponing execution indefinitely", "reducing the sentence by half", "requiring the Supreme Court's concurrence"],
    0, 3, 50, "conceptual", {}],
  // ue_pm
  ["i_ue_5", "c_ue_pm", "The Council of Ministers is collectively responsible to—",
    ["the President", "the Lok Sabha under Article 75(3)", "both Houses of Parliament", "the Rajya Sabha"],
    1, 2, 35, "recall", { 2: "m_collective_responsibility_house" }],
  ["i_ue_6", "c_ue_pm", "A minister who is not a member of either House of Parliament must become one, or cease to be a minister, within—",
    ["3 months", "6 consecutive months", "1 year", "no such limit exists"],
    1, 3, 40, "recall", {}],
  // ue_vp
  ["i_ue_7", "c_ue_vp", "The Vice-President is elected by—",
    ["elected members of Parliament only", "both elected and nominated members of both Houses of Parliament", "State Legislative Assemblies", "an electoral college like the President's"],
    1, 3, 50, "recall", { 0: "m_vp_president_electorate" }],
  ["i_ue_8", "c_ue_vp", "The Vice-President can be removed by—",
    ["impeachment identical to the President's", "a Rajya Sabha resolution by an effective majority, agreed to by the Lok Sabha", "the Lok Sabha alone", "an order of the Chief Justice of India"],
    1, 4, 55, "recall", { 0: "m_vp_impeachment" }],
  // pl_rs
  ["i_pl_1", "c_pl_rs", "A special power of the Rajya Sabha is—",
    ["originating Money Bills", "authorising Parliament to legislate on a State List subject under Article 249", "passing no-confidence motions", "presiding over joint sittings"],
    1, 3, 50, "conceptual", { 0: "m_money_bill_house" }],
  ["i_pl_2", "c_pl_rs", "A Money Bill may be introduced—",
    ["in either House", "only in the Lok Sabha, on the recommendation of the President", "in the Rajya Sabha with the Speaker's certificate", "only after a joint sitting"],
    1, 2, 35, "recall", {}],
  // pl_money
  ["i_pl_3", "c_pl_money", "Whether a Bill is a Money Bill is decided by—",
    ["the President", "the Speaker of the Lok Sabha, whose certificate is final", "the Chairman of the Rajya Sabha", "the Finance Minister"],
    1, 2, 35, "recall", {}],
  ["i_pl_4", "c_pl_money", "The Rajya Sabha must return a Money Bill within—",
    ["6 months", "14 days, with recommendations it may not amend", "one month, with binding amendments", "an unlimited period"],
    1, 3, 40, "recall", { 2: "m_money_rs_amend" }],
  // pl_sess
  ["i_pl_5", "c_pl_sess", "A joint sitting under Article 108 is NOT provided for—",
    ["ordinary Bills", "Money Bills and Constitutional Amendment Bills", "Bills returned by the President", "Bills pending in the Rajya Sabha for 6 months"],
    1, 3, 50, "conceptual", {}],
  ["i_pl_6", "c_pl_sess", "The quorum for either House of Parliament is—",
    ["one-third of total membership", "one-tenth of total membership", "one-half of total membership", "100 members"],
    1, 2, 30, "recall", {}],
  // pl_comm
  ["i_pl_7", "c_pl_comm", "By convention, the Chairman of the Public Accounts Committee is—",
    ["a member of the Opposition", "the Finance Minister", "the Speaker of the Lok Sabha", "nominated only from the Rajya Sabha"],
    0, 3, 45, "recall", {}],
  ["i_pl_8", "c_pl_comm", "The Estimates Committee consists of—",
    ["30 members, all from the Lok Sabha", "22 members from both Houses", "15 Lok Sabha and 7 Rajya Sabha members", "10 members nominated by the President"],
    0, 4, 50, "recall", { 1: "m_pac_estimates_confusion" }],
  // jd_appt
  ["i_jd_1", "c_jd_appt", "Under the collegium system, judges of the Supreme Court are appointed by—",
    ["the President, on the recommendation of the collegium (as evolved in the Judges cases)", "Parliament by special majority", "the Chief Justice of India alone", "a competitive public examination"],
    0, 2, 40, "recall", {}],
  ["i_jd_2", "c_jd_appt", "The Supreme Court collegium for appointing SC judges comprises—",
    ["the CJI and four senior-most judges of the Supreme Court", "the CJI and two senior-most judges", "the CJI, the Law Minister and the Attorney General", "the CJI and three Chief Justices of High Courts"],
    0, 4, 45, "recall", { 2: "m_njac_composition" }],
  // jd_rev
  ["i_jd_3", "c_jd_rev", "Judicial Review in the Indian Constitution is grounded in—",
    ["Articles 13, 32 and 226", "Article 368", "Article 108", "Article 356"],
    0, 3, 45, "recall", {}],
  ["i_jd_4", "c_jd_rev", "A constitutional amendment can be struck down by the Supreme Court if it—",
    ["is passed without a referendum", "violates the basic structure of the Constitution", "changes any Part of the Constitution", "is challenged by a State government"],
    1, 4, 55, "conceptual", {}],
  // jd_pil
  ["i_jd_5", "c_jd_pil", "Public Interest Litigation principally relaxed the doctrine of—",
    ["res judicata", "locus standi", "estoppel", "double jeopardy"],
    1, 2, 35, "recall", {}],
  ["i_jd_6", "c_jd_pil", "PIL may be filed by—",
    ["only the Attorney General", "any public-spirited person on behalf of those unable to approach the court", "only the direct victim of a violation", "only members of Parliament"],
    1, 2, 35, "recall", {}],
  // jd_act
  ["i_jd_7", "c_jd_act", "Judicial activism differs from judicial restraint in that it—",
    ["refuses to hear public-interest cases", "expands the judicial role into policy and administrative domains", "always follows precedent strictly", "limits review to Article 32"],
    1, 3, 50, "conceptual", {}],
  ["i_jd_8", "c_jd_act", "The most serious institutional criticism of judicial overreach is—",
    ["insufficient number of judges", "erosion of the separation of powers", "absence of a written constitution", "lack of PIL mechanisms"],
    1, 2, 40, "conceptual", {}],
  // fd_nat
  ["i_fed_1", "c_fd_nat", "India is described as 'quasi-federal' because—",
    ["it is purely a confederation", "it combines a strong Union tilt with federal structures", "states are creations of the courts", "the Constitution bans regional parties"],
    1, 2, 40, "conceptual", {}],
  ["i_fed_2", "c_fed_nat", "Which provision best illustrates the unitary tilt of the Constitution?",
    ["All-India Services under Article 312", "the Seventh Schedule", "Rajya Sabha representation of states", "the State List"],
    0, 3, 45, "conceptual", {}],
  // fed_rel
  ["i_fed_3", "c_fed_rel", "Residuary legislative powers in India rest with—",
    ["the States", "the Union under Article 248", "the Concurrent List", "local governments"],
    1, 2, 35, "recall", { 0: "m_residuary_us_model" }],
  ["i_fed_4", "c_fed_rel", "If a State law conflicts with a Union law on a Concurrent List subject, then—",
    ["the State law prevails within its territory", "the Union law prevails under Article 254 (subject to exceptions)", "both operate concurrently", "the President decides each case"],
    1, 2, 40, "recall", {}],
  // fed_coun
  ["i_fed_5", "c_fed_coun", "The Inter-State Council is constituted under—",
    ["Article 262", "Article 263", "Article 280", "Article 315"],
    1, 3, 40, "recall", { 0: "m_262_263_confusion" }],
  ["i_fed_6", "c_fed_coun", "Zonal Councils are—",
    ["constitutional bodies under Article 263", "statutory bodies created by the States Reorganisation Act, 1956", "advisory bodies of the Planning Commission era", "judicial tribunals"],
    1, 3, 45, "recall", { 0: "m_constitutional_vs_statutory" }],
  // fed_fin
  ["i_fed_7", "c_fed_fin", "The Finance Commission is constituted under—",
    ["Article 280, at intervals the President determines (statutorily every five years)", "Article 282", "Article 315", "Article 324"],
    0, 2, 35, "recall", {}],
  ["i_fed_8", "c_fed_fin", "Statutory grants-in-aid of revenues of States are provided under—",
    ["Article 275", "Article 282 (discretionary grants)", "Article 276", "Article 268"],
    0, 4, 55, "recall", { 1: "m_275_282_confusion" }],
  // am_proc
  ["i_am_1", "c_am_proc", "Amendment under Article 368 ordinarily requires—",
    ["a simple majority in each House", "a special majority: majority of total membership and two-thirds of members present and voting in each House", "two-thirds of total membership", "a national referendum"],
    1, 3, 55, "recall", { 0: "m_368_majority_type" }],
  ["i_am_2", "c_am_proc", "Besides a special majority, which amendment ALSO requires ratification by at least half the State Legislatures?",
    ["Any change to the Seventh Schedule", "Amendment affecting the election of the President (Articles 54/55)", "Creation of new states", "Salaries and allowances of judges"],
    1, 4, 60, "conceptual", { 0: "m_ratification_scope" }],
  // am_bs
  ["i_am_3", "c_am_bs", "The Basic Structure Doctrine was laid down in—",
    ["Shankari Prasad (1951)", "Golak Nath (1967)", "Kesavananda Bharati (1973)", "Minerva Mills (1980)"],
    2, 3, 45, "recall", { 1: "m_golak_vs_kesavananda" }],
  ["i_am_4", "c_am_bs", "Which element has the Supreme Court treated as part of the basic structure?",
    ["The Seventh Schedule's allocations", "Judicial review", "The President's pardoning power", "The Directive Principles' ordering"],
    1, 3, 45, "recall", {}],
  // am_land
  ["i_am_5", "c_am_land", "Which change was made by the 42nd Amendment, 1976?",
    ["Added 'socialist', 'secular' and 'integrity' to the Preamble", "Deleted the Right to Property from Fundamental Rights", "Introduced the Goods and Services Tax", "Lowered the voting age to 18"],
    0, 2, 40, "recall", { 1: "m_42nd_44th_confusion" }],
  ["i_am_6", "c_am_land", "The Right to Property ceased to be a Fundamental Rights by virtue of—",
    ["the 42nd Amendment", "the 44th Amendment, 1978 (now Article 300A)", "the 73rd Amendment", "the 97th Amendment"],
    1, 3, 40, "recall", { 0: "m_42nd_44th_confusion" }],
  // am_njac
  ["i_am_7", "c_am_njac", "The 99th Amendment (NJAC) was struck down primarily because it—",
    ["was passed without state ratification", "violated the independence of the judiciary, part of the basic structure", "was signed by an Acting President", "conflicted with Article 324"],
    1, 4, 60, "conceptual", {}],
  ["i_am_8", "c_am_njac", "The NJAC was designed to replace—",
    ["the collegium system of judicial appointments", "the Supreme Court's original jurisdiction", "the office of the Attorney General", "the National Legal Services Authority"],
    0, 2, 40, "recall", {}],
  // bd_eci
  ["i_bod_1", "c_bd_eci", "The Election Commission of India is—",
    ["a statutory body under the Representation of the People Act", "a permanent constitutional body under Article 324", "an executive agency under the Home Ministry", "an advisory body to Parliament"],
    1, 2, 35, "recall", { 0: "m_constitutional_vs_statutory" }],
  ["i_bod_2", "c_bd_eci", "In matters of service conditions, the Chief Election Commissioner is equated with—",
    ["a Judge of the Supreme Court", "the Cabinet Secretary", "the Speaker of the Lok Sabha", "the Attorney General"],
    0, 3, 45, "recall", {}],
  // bd_cag
  ["i_bod_3", "c_bd_cag", "The CAG has been described as—",
    ["the friend, philosopher and guide of the Public Accounts Committee", "the guardian of Fundamental Rights", "the head of the Indian Audit and Accounts Service only", "a judge of the audit bench"],
    0, 3, 45, "recall", {}],
  ["i_bod_4", "c_bd_cag", "The CAG's reports relating to the Union are submitted to—",
    ["Parliament directly", "the President, who causes them to be laid before Parliament", "the Chief Justice of India", "the Speaker of the Lok Sabha"],
    1, 2, 40, "recall", { 0: "m_cag_report_route" }],
  // bd_upsc
  ["i_bod_5", "c_bd_upsc", "The Union Public Service Commission is constituted under—",
    ["Articles 315–323", "Articles 280–281", "Articles 324–329", "Articles 76–78"],
    0, 2, 30, "recall", {}],
  ["i_bod_6", "c_bd_upsc", "A UPSC member can be removed, for misbehaviour, only by—",
    ["the President, after an inquiry and reference by the Supreme Court", "Parliament by impeachment", "the Prime Minister", "the Chief Justice of India"],
    0, 3, 50, "recall", {}],
  // bod_niti
  ["i_bod_7", "c_bod_niti", "NITI Aayog replaced the Planning Commission through—",
    ["a constitutional amendment", "an executive resolution of the Union Cabinet (2015)", "an Act of Parliament", "a Presidential ordinance"],
    1, 2, 35, "recall", { 0: "m_constitutional_vs_statutory" }],
  ["i_bod_8", "c_bod_niti", "Which correctly distinguishes the Finance Commission from NITI Aayog?",
    ["FC is a constitutional body recommending tax devolution; NITI Aayog is an executive think tank", "Both are constitutional bodies", "FC allocates plan funds; NITI Aayog audits accounts", "NITI Aayog recommends tax devolution; FC drafts five-year plans"],
    0, 3, 50, "conceptual", {}],
];

export function buildSeedContent(): Content {
  const items: Item[] = ITEMS.map(
    ([id, conceptId, stem, options, answer, difficulty, timeSec, dimension, tags]) => ({
      id,
      conceptId,
      stem,
      options,
      answer,
      difficulty,
      expectedTimeSec: timeSec,
      dimension,
      distractorTags: tags ?? {},
    }),
  );
  return assembleContent(CONTENT_VERSION, EXAM_SPEC, TOPICS, CONCEPTS, items);
}

/** Misconception registry v0 — ids used by distractor tags above. */
export const MISCONCEPTIONS: Record<string, { name: string; contrastWith: string }> = {
  m_goi1919_1935_confusion: { name: "Confuses GoI Act 1919 (dyarchy) with 1935 (provincial autonomy)", contrastWith: "c_cf_hist" },
  m_adopted_vs_enforced: { name: "Confuses adoption (26 Nov 1949) with commencement (26 Jan 1950)", contrastWith: "c_cf_make" },
  m_drafting_vs_president: { name: "Confuses Drafting Committee chairman with Assembly President", contrastWith: "c_cf_make" },
  m_proc_est_vs_due_process: { name: "Confuses procedure established by law (Japan) with due process (USA)", contrastWith: "c_cf_src" },
  m_union_vs_federation: { name: "Thinks Indian federation rests on a states' agreement", contrastWith: "c_cf_sal" },
  m_person_vs_citizen: { name: "Confuses rights of 'any person' with rights of 'citizens'", contrastWith: "c_fr_14" },
  m_19_2_grounds: { name: "Adds non-listed grounds to Art 19(2) restrictions", contrastWith: "c_fr_19" },
  m_law_vs_executive: { name: "Thinks executive order alone can restrict Art 19 rights", contrastWith: "c_fr_19" },
  m_maneka_any_procedure: { name: "Pre-Maneka reading: any enacted procedure suffices for Art 21", contrastWith: "c_fr_21" },
  m_writ_confusion: { name: "Confuses the five writs (habeas/mandamus/certiorari/prohibition/quo warranto)", contrastWith: "c_fr_32" },
  m_dpsp_justiciable: { name: "Thinks DPSPs are court-enforceable", contrastWith: "c_dp_nat" },
  m_fr_dpsp_priority_reversed: { name: "Reverses the FR-over-DPSP early doctrine", contrastWith: "c_dp_conf" },
  m_art44_48_confusion: { name: "Confuses Article 44 (UCC) with other directives", contrastWith: "c_dp_art" },
  m_48a_50_confusion: { name: "Confuses Article 48A (environment) with 50 (judiciary separation)", contrastWith: "c_dp_art" },
  m_42nd_44th_confusion: { name: "Confuses the 42nd (1976) with the 44th (1978) amendment", contrastWith: "c_am_land" },
  m_ten_duties_pre86: { name: "Remembers the pre-86th count of 10 duties", contrastWith: "c_fd_list" },
  m_collective_responsibility_house: { name: "Thinks CoM is responsible to both Houses", contrastWith: "c_ue_pm" },
  m_vp_president_electorate: { name: "Thinks VP electorate excludes nominated MPs", contrastWith: "c_ue_vp" },
  m_vp_impeachment: { name: "Thinks VP removal equals presidential impeachment", contrastWith: "c_ue_vp" },
  m_nominated_in_electorate: { name: "Includes nominated MPs in the presidential electorate", contrastWith: "c_ue_pres" },
  m_impeachment_house: { name: "Thinks impeachment starts in Lok Sabha only", contrastWith: "c_ue_pres" },
  m_art72_161_confusion: { name: "Confuses President's Art 72 with Governor's Art 161 pardon scope", contrastWith: "c_ue_pard" },
  m_money_bill_house: { name: "Misremembers which House originates Money Bills", contrastWith: "c_pl_money" },
  m_money_rs_amend: { name: "Thinks Rajya Sabha can amend Money Bills", contrastWith: "c_pl_money" },
  m_pac_estimates_confusion: { name: "Confuses PAC (22, both Houses) with Estimates (30, LS only)", contrastWith: "c_pl_comm" },
  m_golak_vs_kesavananda: { name: "Confuses Golak Nath with Kesavananda on basic structure", contrastWith: "c_am_bs" },
  m_368_majority_type: { name: "Thinks Art 368 needs only a simple majority", contrastWith: "c_am_proc" },
  m_ratification_scope: { name: "Over/under-inclusive on which amendments need state ratification", contrastWith: "c_am_proc" },
  m_262_263_confusion: { name: "Confuses Art 262 (water tribunals) with 263 (Inter-State Council)", contrastWith: "c_fed_coun" },
  m_constitutional_vs_statutory: { name: "Confuses constitutional bodies with statutory/executive bodies", contrastWith: "c_fed_coun" },
  m_275_282_confusion: { name: "Confuses statutory grants (275) with discretionary grants (282)", contrastWith: "c_fed_fin" },
  m_residuary_us_model: { name: "Assigns residuary powers to states (US model)", contrastWith: "c_fed_rel" },
  m_cag_report_route: { name: "Thinks CAG reports go straight to Parliament", contrastWith: "c_bd_cag" },
};
