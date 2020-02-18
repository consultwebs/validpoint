
/**
 * Offering advice for "website" tests
 * 
 * These tests will be a little more complicated than "local"
 * 
 * @author costmo
 */

let CW_Constants = require( "./CW_Constants.js" );

let CW_AdviceContent = require( "./CW_AdviceContent.js" );
class CW_AdviceContent_WebsiteAdmin extends CW_AdviceContent
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
			category: "website-admin", 
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
		let tags = this.resultTagsForDomain( { inputObject: this.test_result.raw_response } );

		if( tags.length < 1 )
		{
			if( this.command == "domain" )
			{
				this.severity = this.resultTagToSeverity( { resultTag: CW_Constants.RESULT_PASS } );
				this.content = this.contentForSeverity( { severity: this.severity } );
			}
			else // http(s)-port commands
			{
				// The only PUNT condition is a response that takes too long. Without logic below, that will generate a NOTICE
				if( this.test_result.result == CW_Constants.RESULT_PUNT )
				{
					// TODO: Get config to see if we should notify
				}

				let extraKey = null;
				if( (this.command == "http-port" || this.command == "https-port") &&
					this.test_result.raw_response.raw_response == "NO_RESPONSE" )
				{
					extraKey = this.test_result.raw_response.raw_response;
				}
	
				this.severity = this.resultTagToSeverity( { resultTag: this.test_result.result } );
				this.content = this.contentForSeverity( { severity: this.severity, extraInput: extraKey } );
			}

		}
		else // handle more complex responses and direct messages
		{
			this.content = "";
			tags.forEach(
				tag =>
				{
					let severity = this.resultTagToSeverity( { resultTag: tag.result_value, extraInput: tags } );

					if( severity > this.severity )
					{
						this.severity = severity;
						this.test_result.result = tag.result_value;
					}

					if( severity == CW_Constants.SEVERITY_DIRECT_MESSAGE && tags[0].message != undefined && tags[0].message.length > 0 )
					{
						this.content += tags[0].message;
					}
					else
					{
						this.content += this.contentForSeverity( { severity: severity, extraInput: tag.intermediate_key } ) + "\n";
					}

					this.result = tag.result_value;
				}
			);
		}
	}

	/**
	 * A string of tests to riun gathered domain info through to look for problems.
	 * 
	 * @returns Array
	 * @author costmo
	 * @param {*} inputObject			The raw_response from the runner 
	 */
	resultTagsForDomain( { inputObject = null } )
	{
		let returnValue = [];

		if( inputObject && inputObject == "NO_ANSWER" )
		{
			returnValue.push(
				{
					intermediate_key: inputObject,
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}
		else if( inputObject && inputObject == "NO_WHOIS" )
		{
			returnValue.push(
				{
					intermediate_key: inputObject,
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}
		else if( inputObject && inputObject.message && inputObject.message.length > 1 )
		{
			returnValue.push(
				{
					intermediate_key: CW_Constants.NAME_SEVERITY_DIRECT_MESSAGE,
					result_value: CW_Constants.RESULT_FAIL,
					message: inputObject.message
				}
			);
		}

		// Early errors may leave us without a fully-built data structure
		if( !inputObject.servers || !inputObject.servers.ns )
		{
			return returnValue;
		}

		// No name servers present
		if( inputObject.servers.ns.length < 1 )
		{
			returnValue.push(
				{
					intermediate_key: "NS_NONE",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		// TLD is an alias
		if( inputObject.servers.tld_cname.length > 0 )
		{
			returnValue.push(
				{
					intermediate_key: "TLD_IS_ALIAS",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		// No cname for WWW
		if( inputObject.servers.www_cname.length < 1 )
		{
			returnValue.push(
				{
					intermediate_key: "WWW_CNAME_NONE",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		// No MX servers
		if( inputObject.servers.mx.length < 1 )
		{
			returnValue.push(
				{
					intermediate_key: "MX_NONE",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		// No A record for TLF
		if( inputObject.servers.tld_a.length < 1 )
		{
			returnValue.push(
				{
					intermediate_key: "TLD_A_NONE",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		// Domain name expired
		if( inputObject.days_til_expiry < 1 )
		{
			returnValue.push(
				{
					intermediate_key: "DOMAIN_EXPIRED",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		// Domain name will expire
		if( inputObject.days_til_expiry < 90 )
		{
			returnValue.push(
				{
					intermediate_key: "DOMAIN_WILL_EXPIRE",
					result_value: CW_Constants.RESULT_FAIL
				}
			);
		}

		return returnValue;
	}

	/**
	 * Provide the content for the discovered severity on the current instance's command.
	 * 
	 * 
	 * @author costmo
	 * @param {*} severity		The severity for which content is needed 
	 * @param {*} extraInput	Extra input needed to form a reasonable response. MPossibly not used by callers of this specific child class
	 */
	contentForSeverity( { severity = null, extraInput = null } )
	{
		let strings = require( "../validpoint/strings/category.website-admin.js" );
		
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
	 * @param {*} extraInput			Extra input to consider
	 */
	resultTagToSeverity( { resultTag = null, extraInput = null } )
	{
		switch( resultTag )
		{
			// PUNT will happen if the site responded, but took too long
			case "PUNT":
				return CW_Constants.SEVERITY_NOTICE;
			case "FAIL":
				if( extraInput && extraInput[0] && extraInput[0].intermediate_key && extraInput[0].intermediate_key == CW_Constants.NAME_SEVERITY_DIRECT_MESSAGE )
				{
					return CW_Constants.SEVERITY_DIRECT_MESSAGE;
				}
				else
				{
					return CW_Constants.SEVERITY_URGENT;
				}
			default:
				return super.resultTagToSeverity( { resultTag: resultTag } );
		}
	}


}

module.exports =  CW_AdviceContent_WebsiteAdmin;