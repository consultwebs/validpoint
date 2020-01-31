
/**
 * Offering advice for "local" tests
 * 
 * These are going to be simpler than most other tests since any failure is a show-stopper
 * 
 * @author costmo
 */

let CW_Constants = require( "./CW_Constants.js" );

let CW_AdviceContent = require( "./CW_AdviceContent.js" );
class CW_AdviceContent_Local extends CW_AdviceContent
{
	constructor( { command = null, testResult = null } )
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
	 * 
	 */
	advise()
	{
		this.severity = this.resultTagToSeverity( { resultTag: this.test_result.result } );
		this.content = this.contentForSeverity( { severity: this.severity } );
	}

	// TODO: Use localization to feed content
	contentForSeverity( {severity = null } )
	{
		switch( severity )
		{
			case CW_Constants.SEVERITY_ESSENTIAL:
			case CW_Constants.SEVERITY_URGENT:
				if( this.command == "local-network" )
				{
					return "You are not currently connected to the Internet, and none of these tests are likely to work. Contact your Internet Service Provider.";
				}
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