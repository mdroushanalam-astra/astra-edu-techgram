// Compatibility entry point: the persisted teacher replaces the former question-only journey.
// Run only with a disposable API database. Historical connected-qa.json is retained.
require("./frontend_upgrade_qa.cjs");
