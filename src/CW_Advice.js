let CW_Constants = require( "./CW_Constants.js" );

/**
 * Produce human-meaningful advice.
 * 
 * Tests should generally PASS or FAIL, but we're providing a PUNT state to 
 * allow a caller to take possession and make decisions on non-binary 
 * results (something other than PAS|FAIL)
 * 
 * NOTE: Member variables that are intended to be used directly in JSON output are not camelCased.
 * 
 * @author costmo
 */
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
		 * 
		 * @type {object}
		 */
		this.configObject = null;

		/**
		 * The domain name for the instance
		 * 
		 * @type {string}
		 */
		this.domain = "";

		/**
		 * The greatest severity seen during the current test run
		 * 
		 * @type {number}
		 */
		this.greatest_severity = CW_Constants.SEVERITY_IGNORE; // not camelCase because this member is used in JSON output

		/**
		 * An empty "full results" array of result and action objects for callers to populate for later parsing
		 * 
		 * @type {object}
		 */
		this.test_result = {
			"results": [],		// Results of individual tests to iterate and parse when all tests are complete for a given domain.
			"actions": []		// Things to do in response to the results. To be populated during a finalization process.
		}; 

		// Add an empty constructed response to a single command
		this.clearItemResult();
	}

	/**
	 * Replace the constructed member's item_result with one that's empty.
	 * 
	 * Useful for using a single instance for multiple/chained tests
	 * 
	 * @author costmo
	 */
	clearItemResult()
	{
		this.item_result = {
			"command": "",
			"category": "",
			"result": CW_Constants.RESULT_UNTESTED,
			"result_tags": [],
			"raw_response": "",
			"response_time": -1
		}; 
	}

	/**
	 * Get yer clean Action object here. Constrain the members of an action object
	 * 
	 * @author costmo
	 * @returns {object}		An object with pre-populated empty members
	 */
	getEmptyActionObject()
	{
		let returnValue = 
		{
			"category": "",
			"command": "",
			"result": "",
			"severity": "",
			"content": ""
		};

		return returnValue;
	}

	/**
	 * After running the final test, parse the results to offer final advice
	 * 
	 * @author costmo
	 * @param {*} stripConfigObject			Whether or not the configObject member should be removed prior to output
	 */
	finalizeOutput( { stripConfigObject = true, stripItemResult = true } )
	{
		// Iterate the test results and send them to a helper to get specific advice
		this.test_result.results.forEach(
			result =>
			{
				// Push the parsed result to the 'actions' 
				let parsedResult = this.parseResult( { result: result } );

				// Do not push "OK" and "IGNORE" results into the "actions" array since we'll never "act" on them
				if( parsedResult.severity > CW_Constants.SEVERITY_OK )
				{
					this.test_result.actions.push( parsedResult );
				}
			}
		);

		// Make sure we're all cleaned up - constructive action
		// this.clearItemResult();

		// Cleanup - destructive actions
		if( (this.configObject) && (stripConfigObject == true) )
		{
			delete this.configObject;
		}
		if( (stripItemResult == true) )
		{
			delete this.item_result;
		}

	}

	/**
	 * Farm out the work of parsing a resultItem and pushing actionable items to the `actions` array
	 * 
	 * @author costmo
	 * @returns {object}	An object with the result
	 */
	parseResult()
	{
		let returnValue = 
		{	...this.getEmptyActionObject(),
			category: this.item_result.category,
			command: this.item_result.command,
			result: this.item_result.result
		}

		// We got a PASS or, so there's nothing else to do
		if( returnValue.result == CW_Constants.RESULT_PASS )
		{
			returnValue.severity = CW_Constants.SEVERITY_OK;

			// Set "OK" at the top-level if we've only seen "IGNORE" 
			this.greatest_severity = ( CW_Constants.SEVERITY_OK > this.greatest_severity ) 
					? CW_Constants.SEVERITY_OK : this.greatest_severity;
		}
		else if( returnValue.result == CW_Constants.IGNORE ) // simple population of IGNORE items - something that presumably did not actually run
		{
			returnValue.severity = CW_Constants.SEVERITY_IGNORE;
		}
		else // Farm out logic for parsing FAIL and PUNT conditions
		{
			let adviceContent = null;

			// Use separate handlers for each command category	
			if( returnValue.category == "local" )
			{
				let CW_AdviceContent_Local = require( "./CW_AdviceContent_Local.js" );

				adviceContent = new CW_AdviceContent_Local({
					command:  returnValue.command,
					testResult: this.item_result,
					configObject: this.configObject
				});
				
			} // category: "local"
			else if( returnValue.category == "website" )
			{
				let CW_AdviceContent_Website = require( "./CW_AdviceContent_Website.js" );

				adviceContent = new CW_AdviceContent_Website({
					command:  returnValue.command,
					testResult: this.item_result,
					configObject: this.configObject
				});
			} // category: "website"
			else if( returnValue.category == "website-admin" )
			{
				let CW_AdviceContent_WebsiteAdmin = require( "./CW_AdviceContent_WebsiteAdmin.js" );

				adviceContent = new CW_AdviceContent_WebsiteAdmin({
					command:  returnValue.command,
					testResult: this.item_result,
					configObject: this.configObject
				});

			} // category: "website-admin"

			// We've got a category-specific object, now advise
			if( adviceContent ) // weeds out addons
			{
				adviceContent.advise();
				returnValue.result =  adviceContent.result;

				// If this is the greatest severity we've seen, set the new top-level
				this.greatest_severity = ( adviceContent.severity > this.greatest_severity ) 
					? adviceContent.severity : this.greatest_severity;

				
				returnValue.severity = adviceContent.severity;
				returnValue.content = adviceContent.content;
			}
			
		}

		return returnValue;
	}
}

module.exports =  CW_Advice;
