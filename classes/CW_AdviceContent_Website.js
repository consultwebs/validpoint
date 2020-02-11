
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

		if( this.command == "website-content" )
		{
			let tags = this.resultTagsForContent( { inputObject: this.test_result.raw_response } );

			// Nothing was wrong
			if( tags.length < 1 )
			{
				this.severity = this.resultTagToSeverity( { resultTag: CW_Constants.RESULT_PASS } );
				this.content = this.contentForSeverity( { severity: this.severity } );
			}
			else
			{
				// handle more complicated severity determinations
				this.content = "";
				tags.forEach(
					tag =>
					{
						let severity = this.resultTagToSeverity( { resultTag: tag.result_value, extraKey: tag.intermediate_key } );
						if( severity > this.severity )
						{
							this.severity = severity;
							this.test_result.result = tag.result_value;
						}

						this.content += this.contentForSeverity( { severity: severity, extraInput: tag.intermediate_key } ) + "\n";
						this.result = tag.result_value;
					}
				);
			}
		}
		else if(	(this.command == "http-response" || this.command == "https-response" || 
					 this.command == "website" || this.command == "secure-website" ) 
					&&  
					(this.test_result.raw_response.raw_response == "NO_RESPONSE" || // raw_response for http(s)-response generated objects is an object containing a raw_response
					 this.test_result.raw_response == "NOT_FOUND" || 
					 this.test_result.raw_response == "TIMED_OUT" ) )
		{
			let extraInput = (this.command.indexOf( "http" ) === 0 ) ? this.test_result.raw_response.raw_response : this.test_result.raw_response;

			this.severity = this.resultTagToSeverity( { resultTag: this.test_result.result } );
			this.content = this.contentForSeverity( { severity: this.severity, extraInput: extraInput } );
		}
		else if(this.command == "website" || this.command == "secure-website" ) // website command passed useful information from the test back to here
		{
			let extraInput = this.test_result.raw_response;

			this.severity = this.resultTagToSeverity( { resultTag: this.test_result.result, extraKey: "REPLACEMENT" } );
			this.content = this.contentForSeverity( { severity: this.severity, extraInput: "REPLACEMENT" } );
			this.content = this.content.replace( '%response%', this.test_result.raw_response );
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
				if( extraInput && 
					undefined != (strings[ this.command ][ extraInput ][ CW_Constants.NAME_SEVERITY_NOTICE ]) )
				{
					return strings[ this.command ][ extraInput ][ CW_Constants.NAME_SEVERITY_NOTICE ];
				}
				else
				{
					return strings[ this.command ][ CW_Constants.NAME_SEVERITY_NOTICE ];
				}
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
	 * @param {*} extraKey				An optional extra key to help refine the lookup
	 */
	resultTagToSeverity( { resultTag = null, extraKey = null } )
	{
		switch( resultTag )
		{
			// PUNT will happen if there is a redirect and the redirect location domain does not match
			case "PUNT":
				return CW_Constants.SEVERITY_NOTICE;
			case "FAIL":
				if( extraKey && extraKey.length > 0 )
				{
					switch( extraKey )
					{
						case "HEAD_NONE":
						case "H1_NONE":
						case "NOINDEX":
						case "REPLACEMENT":
							return CW_Constants.SEVERITY_NOTICE;
						default:
							return CW_Constants.SEVERITY_URGENT;
					}
				}
				else // end if( extraKey && extraKey.length > 0 ) for case: FAIL
				{
					return CW_Constants.SEVERITY_URGENT;
				}
			default:
				return super.resultTagToSeverity( { resultTag: resultTag } );
		}
	}

	/**
	 * A string of tests to riun gathered domain info through to look for problems.
	 * 
	 * @returns Array
	 * @author costmo
	 * @param {*} inputObject			The raw_response from the runner 
	 */
	resultTagsForContent( { inputObject = null } )
	{
		let returnValue = [];

		// We get a DOM tree if there are real results to examine. Otherwise, there was an error getting the DOM
		if( typeof inputObject !== "object" )
		{
			returnValue.push(
				{
					intermediate_key: inputObject,
					result_value: CW_Constants.RESULT_FAIL
				}
			);

			return returnValue;
		}

		// A series of things that should be present in the HTML
		if( (!inputObject.headNode.childNodes) || 
			(inputObject.headNode.childNodes.length < 1) )
		{
			returnValue.push(
				{
					intermediate_key: "HEAD_NONE",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		if( (!inputObject.titleNode.childNodes) || 
			(inputObject.titleNode.childNodes.length < 1) ||
			(inputObject.titleNode.rawText.length < 1) )
		{
			returnValue.push(
				{
					intermediate_key: "TITLE_NONE",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		if( (!inputObject.bodyNode.childNodes) || 
			(inputObject.bodyNode.childNodes.length < 1) ||
			(inputObject.bodyNode.rawText.length < 1) )
		{
			returnValue.push(
				{
					intermediate_key: "BODY_NONE",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		// We're only checking for 1
		if( (!inputObject.h1Node.childNodes) || 
			(inputObject.h1Node.childNodes.length < 1) /*|| // requires separate parsing if there's more than one
			(inputObject.h1Node.rawText.length < 1)*/ )
		{
			returnValue.push(
				{
					intermediate_key: "H1_NONE",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		// walk through meta tags to find a "noindex"
		if(  inputObject.metaNodes &&
			inputObject.metaNodes.length > 0 )
		{
			inputObject.metaNodes.forEach(
				node =>
				{
					if( node.rawAttrs.indexOf( "noindex" ) > -1 )
					{
						returnValue.push(
							{
								intermediate_key: "NOINDEX",
								result_value: CW_Constants.RESULT_FAIL
							}
						);
					}
					
				}
			);
		}
		
		return returnValue;
	}


}

module.exports =  CW_AdviceContent_Website;