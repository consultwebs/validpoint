
/**
 * Offering advice for "website" tests
 * 
 * These tests will be a little more complicated than "local"
 * 
 * @author costmo
 */

let CW_Constants = require( "./CW_Constants.js" );

let CW_AdviceContent = require( "./CW_AdviceContent.js" );
class CW_AdviceContent_Website extends CW_AdviceContent
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
			category: "website", 
			command: command,
			testResult: testResult 
		});

		this.configObject = configObject;
		
	}

	/**
	 * Advice content hub for "website" requests.
	 * 
	 * Once an Advice object has its test results, the parser runs this category-specific method to 
	 *   produce an action object
	 * 
	 * @author costmo
	 * 
	 */
	advise()
	{
		// The only PUNT condition is a redirect
		if( this.test_result.result == CW_Constants.RESULT_PUNT )
		{
			// If the redirect points to something other than the user's domain, set the severity
			if( this.test_result.raw_response.raw_response.indexOf( this.configObject.domain ) > -1 )
			{
				this.test_result.result = CW_Constants.RESULT_PASS;
			}
		}

		// TODO: Parse this.test_result.raw_response.raw_response for 404 or 500 errors
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
	 * @param {*} extraInput	Extra input needed to form a more precise response
	 */
	contentForSeverity( { severity = null, extraInput = null } )
	{
		let strings = require( "../Validpoint/strings/category.website.js" );
		
		switch( severity )
		{
			case CW_Constants.SEVERITY_NOTICE:
				return strings[ this.command ][ CW_Constants.NAME_SEVERITY_NOTICE ];
			case CW_Constants.SEVERITY_ESSENTIAL:
			case CW_Constants.SEVERITY_URGENT:
				if( extraInput && 
					undefined != (strings[ this.command ][ extraInput ][ CW_Constants.NAME_SEVERITY_URGENT ]) )
				{
					return strings[ this.command ][ extraInput ][ CW_Constants.NAME_SEVERITY_URGENT ];
				}
				else
				{
					return strings[ this.command ][ CW_Constants.NAME_SEVERITY_URGENT ];
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
			// PUNT will happen if there is a redirect and the redirect location domain does not match
			case "PUNT":
				return CW_Constants.SEVERITY_NOTICE;
			case "FAIL":
				return CW_Constants.SEVERITY_URGENT;
			default:
				return super.resultTagToSeverity( { resultTag: resultTag } );
		}
	}


}

module.exports =  CW_AdviceContent_Website;