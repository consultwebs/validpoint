/**
 * Produce human-meaningful advice.
 * 
 * Tests should generally PASS or FAIL, but we're providing a PUNT state to 
 *    allow a caller to take possession and make decisions on non-binary 
 *    results (something other than PAS|FAIL)
 * 
 * @author costmo
 */

let CW_Constants = require( "./CW_Constants.js" );

class CW_Advice
{
    /**
     * Create a new instance
     * 
     * @author costmo
     */
    constructor()
    {
		/**
		 * Have a caller set a config object that can be used for the entire instance
		 */
		this.configObject = null;

		/**
		 * The domain name for the instance
		 */
		this.domain = "";

		// An empty "full results" array of result and action objects for callers to populate for later parsing
		this.testResult = {
			"results": [],		// Results of individual tests to iterate and parse when all tests are complete for a given domain.
			"actions": []		// Things to do in response to the results. To be populated during a finalization process.
		}; 

		// Add an empty constructed response to a single command
		this.clearItemResult();
	}

	/**
	 * Replace the constructed member's itemResult with one that's empty.
	 * 
	 * Useful for using a single instance for multiple/chained tests
	 * 
	 * @author costmo
	 */
	clearItemResult()
	{
		this.itemResult = {
			"command": "",
			"category": "",
			"result": CW_Constants.RESULT_UNTESTED,
			"result_tags": [],
			"raw_response": "",
			"response_time": -1
		}; 
	}

	/**
	 * After running the final test, parse the results to offer final advice
	 * 
	 * @author costmo
	 * @param {*} stripConfigObject			Whether or not the configObject member should be removed prior to output
	 */
	finalizeOutput( { stripConfigObject = true, stripItemResult = true } )
	{
		// Make sure we're all cleaned up - constructive phase
		this.clearItemResult();

		// Iterate the test results and send them to a helper to get specific advice
		this.testResult.results.forEach(
			result =>
			{
				// console.log( "Parsing result:" );
				// console.log( result );
				this.parseResult( { result: result } );
			}
		);

		// Make sure we're all cleaned up - destructive phase
		if( (this.configObject) && (stripConfigObject == true) )
		{
			delete this.configObject;
		}
		if( (stripItemResult == true) )
		{
			delete this.itemResult;
		}

	}

	/**
	 * Farm out the work of parsing a resultItem and pushing actionable items to the `actions` array
	 * 
	 * // TODO: Farm out logic for parsing conditions here
	 * 
	 * @author costmo
	 * @param {*} result		The resultItem to parse 
	 */
	parseResult( { result: result } )
	{
		// console.log( "Parsing: " );
		// console.log( result );
	}
}

module.exports =  CW_Advice;
