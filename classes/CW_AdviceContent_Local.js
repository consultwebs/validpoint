
/**
 * Offering advice for "local" tests
 * 
 * These are going to be simpler than most other tests since any failure is a show-stopper,
 *    and each test has a binary respnonse
 * 
 * @author costmo
 */

let CW_Constants = require( "./CW_Constants.js" );

let CW_AdviceContent = require( "./CW_AdviceContent.js" );
class CW_AdviceContent_Local extends CW_AdviceContent
{
	/**
	 * Create an instance for a finished command and testResult
	 * 
	 * @param {*} command		The command that has finished
	 * @param {*} testResult	A test_result object to parse 
	 * @param {*} configObject	A user's config object
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
	 * Advice content hub for "local" requests.
	 * 
	 * Once an Advice object has its test results, the parser runs this category-specific method to 
	 *   produce an action object
	 * 
	 * @author costmo
	 * 
	 */
	advise()
	{
		this.severity = this.resultTagToSeverity( { resultTag: this.test_result.result } );
		this.content = this.contentForSeverity( { severity: this.severity } );
	}

	/**
	 * Provide the content for the discovered severity on the current instance's command.
	 * 
	 * Commands in the "local" category only need content for ESSENTIAL and URGENT
	 * 
	 * // TODO: Use localization to feed content
	 * 
	 * @author costmo
	 * @param {*} severity		The severity for which content is needed 
	 */
	contentForSeverity( { severity = null } )
	{
		let strings = require( "../Validpoint/strings/category.local.js" );
		
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
	 * TODO: Get this setting from system configuration
	 * TODO: Get this setting from client configuration and override the system config setting
	 * 
	 * @param {*} resultTag				The result tag to map  
	 */
	resultTagToSeverity( { resultTag = null } )
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