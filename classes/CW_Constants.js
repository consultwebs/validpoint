module.exports = Object.freeze(
{
	RESULT_FAIL: "FAIL",			// An advice result that means "test failed and specific advice may be needed, depending on configured settings"
	RESULT_PASS: "PASS",			// An advice result that means "test passed and we do not need to offer specific advice"
	RESULT_PUNT: "PUNT",			// An advice result that means "test results are not binary and the caller will handle providing proper advice"
	RESULT_UNTESTED: "UNTESTED",	// Not yet tested

	NAME_SEVERITY_IGNORE: "IGNORE",
	NAME_SEVERITY_OK: "OK",
	NAME_SEVERITY_NOTICE: "NOTICE",
	NAME_SEVERITY_ESSENTIAL: "ESSENTIAL",
	NAME_SEVERITY_URGENT: "URGENT",

	SEVERITY_IGNORE: -1,
	SEVERITY_OK: 0,
	SEVERITY_NOTICE: 1,
	SEVERITY_ESSENTIAL: 2,
	SEVERITY_URGENT: 3


});