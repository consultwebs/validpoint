let CW_Constants = require( "./node_modules/validpoint/dist/CW_Constants" );
let CW_AdviceContent = require( "./node_modules/validpoint/dist/CW_AdviceContent" );

/**
 * Offering advice for website custom text addon tests
 * 
 * @author costmo
 */
class CW_AdviceContent_WebsiteH1 extends CW_AdviceContent
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
			category: "addon", 
			command: command,
			testResult: testResult 
		});
		
	}

	/**
	 * Offers advice while tests are in-progress
	 * 
	 * @returns	{object}			Returns an object or prints to the screen
	 * @author costmo
	 * 
	 * @param {object} input					Named parameters for input
	 * @param {string} input.content		A string holding the content to parse
	 * @param {string} input.find			The input to find
	 * @param {object} input.configObject	A constructed configuration object
	 */
	inProgressAdvice( {content = null, configObject = null} )
	{
		let returnValue = {
			result: CW_Constants.RESULT_PASS,
			content: "",
			severity: CW_Constants.SEVERITY_OK
		}

		// Empty content or an intentional "ERROR" response
		if( !content || content == "ERROR" )
		{
			CW_AdviceContent.progressContent( { configObject: configObject,
				input: "failed\n".error + "Your website contained no HTML and will not be visible to users.\n\n".ok
			});
			returnValue.result = CW_Constants.RESULT_FAIL;
		}
		else // we have content
		{
			if( content && content.length > 0 && content !== "notfound" && content.indexOf( "h1 " ) > -1 ) // found the string
			{
				CW_AdviceContent.progressContent( { configObject: configObject,
					input: "good\n".ok + "Your website contains at least one H1 tag\n\n".text
				});
				returnValue.result = CW_Constants.RESULT_PASS;
			}
			else // string not found
			{
				CW_AdviceContent.progressContent( { configObject: configObject,
					input: "failed\n".error + "Your website does NOT contain any H1 tags\n\n".error
				});
				returnValue.result = CW_Constants.RESULT_FAIL;
			}
		}

		// Fill in severity and content for the return results
		returnValue.severity = this.resultTagToSeverity( { resultTag: returnValue.result } );
		returnValue.content = this.contentForSeverity( {severity: returnValue.severity} );

		return returnValue;
	}

	/**
	 * Provide the content for the discovered severity on the current instance's command.
	 * 
	 * @author costmo
	 * @returns {string}		A string with the content for the given severity and test parameters
	 * 
	 * @param {object} input					Named parameters for input
	 * @param {number} input.severity			The severity for which content is needed 
	 */
	contentForSeverity( { severity = null } )
	{
		let strings = require( "./strings/category.addon.js" );
		let output = "";
		
		switch( severity )
		{
			case CW_Constants.SEVERITY_OK:
				return strings[ this.command ][ CW_Constants.NAME_SEVERITY_OK ];
			case CW_Constants.SEVERITY_URGENT:
				return strings[ this.command ][ CW_Constants.NAME_SEVERITY_URGENT ];
			default:
				return "";
		}
	}

	/**
	 * Override default "tag to severity" mapping for this specific "addon" request
	 * 
	 * Uses the system default for anything other than "PASS" or "FAIL"
	 * 
	 * @author costmo
	 * @returns {number}					The constant resolving to the given severity
	 * @param {object} input					Named parameters for input
	 * @param {string} input.resultTag				The result tag to map 
	 */
	resultTagToSeverity( { resultTag = null } )
	{
		switch( resultTag )
		{
			case "FAIL":
				return CW_Constants.SEVERITY_URGENT;
			case "PASS":
				return CW_Constants.SEVERITY_OK;
			default:
				return super.resultTagToSeverity( { resultTag: resultTag } );
		}
	}


}

module.exports =  CW_AdviceContent_WebsiteH1;