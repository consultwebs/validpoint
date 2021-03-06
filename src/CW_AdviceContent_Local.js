let CW_Constants = require( "./CW_Constants.js" );
let CW_AdviceContent = require( "./CW_AdviceContent.js" );

/**
 * Offering advice for "local" tests
 * 
 * These are going to be simpler than most other tests since any failure is a show-stopper, \
 * and each test has a binary respnonse
 * 
 * @author costmo
 */
class CW_AdviceContent_Local extends CW_AdviceContent
{
	/**
	 * Create an instance for a finished command and testResult
	 * 
	 * @author costmo
	 * @param {object} input					Named parameters for input
	 * @param {string} input.command		The command that has finished
	 * @param {object} input.testResult	A test_result object to parse 
	 * @param {object} input.configObject	A user's config object
	 */
	constructor( { command = null, testResult = null, configObject = null } )
	{
		super({ 
			category: "local", 
			command: command,
			testResult: testResult 
		});
		
	}

	/**
	 * Offers advice while tests are in-progress
	 * 
	 * @returns	{string}			Returns an object or prints to the screen
	 * @author costmo
	 * 
	 * @param {object} input					Named parameters for input
	 * @param {string} input.testKey		A key to identify what is being tested
	 * @param {object} input.configObject	A constructed configuration object
	 * @param {string} input.returnType	"screen" to display the results, anything else to get an object 
	 */
	inProgressAdvice( {testKey = null, configObject = null, returnType = "screen"} )
	{
		let returnValue = {
			printAnswer: "",
			printSubject: "",
			printDetail: ""
		};

		let severity = 0;

		let serverArray = [];
		let tags = [];
		switch( testKey )
		{
			case "LOCAL_DNS":
			case "LOCAL_NETWORK":
				if( this.test_result.result == CW_Constants.RESULT_PASS )
				{
					returnValue.printAnswer = "good\n".ok;
				}
				else if( this.test_result.result == CW_Constants.RESULT_FAIL &&
					this.test_result.raw_response && this.test_result.raw_response.message && this.test_result.raw_response.message.length > 0 )
				{
					returnValue.printAnswer = "fail\n".error;
					returnValue.printDetail = this.test_result.raw_response.message;
				}
				else
				{
					returnValue.printAnswer = "fail\n".error;
					severity = this.resultTagToSeverity( { resultTag: this.test_result.result } );
					returnValue.printDetail = this.contentForSeverity( { severity: severity } ).error;
				}
				break;
		}

		if( returnType == "screen" && !configObject.be_quiet )
		{
			process.stdout.write( returnValue.printAnswer + "\n" );
			if( returnValue.printDetail.length > 0 )
			{
				process.stdout.write( returnValue.printDetail + "\n" );
			}
		}
		else
		{
			return returnValue;
		}

	}

	/**
	 * Advice content hub for "local" requests.
	 * 
	 * Once an Advice object has its test results, the parser runs this category-specific method to \
	 * produce an action object
	 * 
	 * @author costmo
	 * 
	 */
	advise()
	{
		let directMessage = null;
		// If there was a system error, it will be passed up as a direct message
		if( this.test_result.result == CW_Constants.RESULT_FAIL &&
			this.test_result.raw_response && this.test_result.raw_response.message && this.test_result.raw_response.message.length > 0 )
		{
			this.severity = CW_Constants.SEVERITY_DIRECT_MESSAGE;
			this.content = this.test_result.raw_response.message;
		}
		else
		{
			this.severity = this.resultTagToSeverity( { resultTag: this.test_result.result } );
			this.content = this.contentForSeverity( { severity: this.severity } );
		}
	}

	/**
	 * Provide the content for the discovered severity on the current instance's command.
	 * 
	 * Commands in the "local" category only need content for ESSENTIAL and URGENT
	 * 
	 * @author costmo
	 * @returns {string}		A string with the content for the given severity and test parameters
	 * 
	 * @param {object} input					Named parameters for input
	 * @param {number} input.severity		The severity for which content is needed 
	 */
	contentForSeverity( { severity = null } )
	{
		let strings = require( "./strings/category.local.js" );
		
		switch( severity )
		{
			case CW_Constants.SEVERITY_ESSENTIAL:
			case CW_Constants.SEVERITY_URGENT:
				return strings[ this.command ][ CW_Constants.NAME_SEVERITY_URGENT ];
			default:
				return "";
		}
	}

	/**
	 * Override default "tag to severity" mapping for this specific "local" request
	 * 
	 * Uses the system default for anything other than "FAIL"
	 * 
	 * @param {*} resultTag				The result tag to map  
	 */

	/**
	 * Override default "tag to severity" mapping for this specific "local" request
	 * 
	 * Uses the system default for anything other than "FAIL"
	 * 
	 * @author costmo
	 * @returns {number}					The constant resolving to the given severity
	 * @param {object} input					Named parameters for input
	 * @param {string} input.resultTag				The result tag to map 
	 * @param {string} input.extraInput				Extra input to use in determination of the output
	 */
	resultTagToSeverity( { resultTag = null, extraInput = null } )
	{
		switch( resultTag )
		{
			case "FAIL":
				return CW_Constants.SEVERITY_URGENT;
			default:
				return super.resultTagToSeverity( { resultTag: resultTag } );
		}
	}


}

module.exports =  CW_AdviceContent_Local;