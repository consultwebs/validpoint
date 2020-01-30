module.exports = Object.freeze(
{
	RESULT_FAIL: "FAIL",			// An advice result that means "test failed and specific advice may be needed, depending on configured settings"
	RESULT_PASS: "PASS",			// An advice result that means "test passed and we do not need to offer specific advice"
	RESULT_PUNT: "PUNT",			// An advice result that means "test results are not binary and the caller will handle providing proper advice"
	RESULT_UNTESTED: "UNTESTED",	// Not yet tested

	NAME_ALERT_IGNORE: "IGNORE",
	NAME_ALERT_MINOR: "MINOR",
	NAME_ALERT_MAJOR: "MAJOR",
	NAME_ALERT_CRITICAL: "CRITICAL",
	NAME_ALERT_EMERGENCY: "EMERGENCY",

	ALERT_IGNORE: -1,
	ALERT_MINOR: 0,
	ALERT_MAJOR: 1,
	ALERT_CRITICAL: 2,
	ALERT_EMERGENCY: 3,


});