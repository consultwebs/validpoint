
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
		// Make a separate parser for the domain command since it has a lot of things to check
		if( this.command == "domain" )
		{
			let tags = this.resultTagsForDomain( { inputObject: this.test_result.raw_response } );

			if( tags.length < 1 )
			{
				this.severity = this.resultTagToSeverity( { resultTag: CW_Constants.RESULT_PASS } );
				this.content = this.contentForSeverity( { severity: this.severity } );
			}
			else
			{
				this.content = "";
				tags.forEach(
					tag =>
					{
						let severity = this.resultTagToSeverity( { resultTag: tag.result_value } );
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
		else
		{
			// The only PUNT condition is a response that takes too long. Without logic below, that will generate a NOTICE
			if( this.test_result.result == CW_Constants.RESULT_PUNT )
			{
				// TODO: Get config to see if we should notify
			}

			this.severity = this.resultTagToSeverity( { resultTag: this.test_result.result } );
			this.content = this.contentForSeverity( { severity: this.severity } );
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
		let strings = require( "../Validpoint/strings/category.website-admin.js" );
		
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
			// PUNT will happen if the site responded, but took too long
			case "PUNT":
				return CW_Constants.SEVERITY_NOTICE;
			case "FAIL":
				return CW_Constants.SEVERITY_URGENT;
			default:
				return super.resultTagToSeverity( { resultTag: resultTag } );
		}
	}


}

module.exports =  CW_AdviceContent_WebsiteAdmin;