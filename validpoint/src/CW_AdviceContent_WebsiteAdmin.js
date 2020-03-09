
/**
 * Offering advice for "website" tests
 * 
 * These tests will be a little more complicated than "local"
 * 
 * @author costmo
 */

let CW_Constants = require( "./CW_Constants" );

let CW_AdviceContent = require( "./CW_AdviceContent" );
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
	 * Offers advice while tests are in-progress
	 * 
	 * @returns	mixed			Returns an objcet or prints to the screen
	 * @author costmo
	 * 
	 * @param {*} testKey		A key to identify what is being tested
	 * @param {*} configObject	A constructed configuration object
	 * @param {*} returnType	"screen" to display the results, anything else to get an object 
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

		// which test to run
		switch( testKey )
		{
			case "WEBSITE_AVAILABILITY":
				//returnValue.printSubject = "Checking response time...   ".text;
				returnValue.printSubject = configObject.url.subject + " responded in: ".text;
				returnValue.printSubject += Math.ceil( this.test_result.raw_response.response_time ).toString().result + "ms".result;

				if( this.test_result.raw_response.response_time < CW_Constants.MAX_HTTTP_RESPONSE_TIME )
				{
					returnValue.printSubject += " good".ok;
				}
				else
				{
					returnValue.printSubject += " warning\n".warn;
					returnValue.printSubject += this.contentForSeverity( { severity: CW_Constants.SEVERITY_NOTICE, extraInput: "TIMED_OUT" } ).warn;
				}
				break;
			case "NS":
				// Show a header
				returnValue.printSubject = "Found name servers for ".text + configObject.domain.subject + ": ".text;
				// Fill an array with results to display
				serverArray = this.test_result.servers.ns;

				// Push errors or notices to the `tags` array
				if( this.test_result.servers.ns.length < 1 )
				{
					tags.push(
						{
							intermediate_key: "NS_NONE",
							result_value: CW_Constants.RESULT_FAIL
						}
					);
				}
				break;
			case "MX":
				returnValue.printSubject = "Found mail servers for ".text + configObject.domain.subject + ": ".text;
				serverArray = this.test_result.servers.mx;

				if( this.test_result.servers.mx.length < 1 )
				{
					tags.push(
						{
							intermediate_key: "MX_NONE",
							result_value: CW_Constants.RESULT_FAIL
						}
					);
				}
				break;
			case "TLD_A":
				returnValue.printSubject = "Found \"A\" records for ".text + configObject.domain.subject + ": ".text;
				serverArray = this.test_result.servers.tld_a;

				if( this.test_result.servers.tld_a.length < 1 )
				{
					tags.push(
						{
							intermediate_key: "TLD_A_NONE",
							result_value: CW_Constants.RESULT_FAIL
						}
					);
				}
				break;
			case "WWW_A":
				returnValue.printSubject = "Found \"A\" records for ".text + configObject.url.subject + ": ".text;
				serverArray = this.test_result.servers.www_a;

				if( this.test_result.servers.www_a.length < 1 )
				{
					tags.push(
						{
							intermediate_key: "WWW_A_NONE",
							result_value: CW_Constants.RESULT_PUNT
						}
					);
				}
				break;
			case "WWW_CNAME":
					returnValue.printSubject = "Found \"CNAME\" records for ".text + configObject.url.subject + ": ".text;
					serverArray = this.test_result.servers.www_cname;
	
					if( this.test_result.servers.www_cname.length < 1 && this.test_result.servers.www_a.length < 1 )
					{
						tags.push(
							{
								intermediate_key: "WWW_CNAME_A_NONE",
								result_value: CW_Constants.RESULT_FAIL
							}
						);
					}
					break;
			case "TLD_CNAME":
				if( this.test_result.servers.tld_cname.length > 0 )
				{
					returnValue.printSubject = "Found \"CNAME\" records for ".text + configObject.domain.subject + ": ".text;
					serverArray = this.test_result.servers.tld_cname;
				}
				else
				{
					tags.push(
						{
							intermediate_key: "TLD_CNAME_NONE",
							result_value: CW_Constants.RESULT_PASS
						}
					)
				}
				break;
			case "WHOIS":
				if( !this.test_result.days_til_expiry || this.test_result.days_til_expiry < 1 )
				{
					tags.push(
						{
							intermediate_key: "DOMAIN_EXPIRED",
							result_value: CW_Constants.RESULT_FAIL
						}
					);
				}
				else if( this.test_result.days_til_expiry < 90 )
				{
					serverArray = [ configObject.domain.subject + " is expiring in " + this.test_result.days_til_expiry + " days" ];
					tags.push(
						{
							intermediate_key: "DOMAIN_WILL_EXPIRE",
							result_value: CW_Constants.RESULT_PUNT
						}
					);
				}
				else
				{
					returnValue.printSubject = configObject.domain.subject + " is expiring in " + this.test_result.days_til_expiry + " days";
					serverArray = [ this.test_result.days_til_expiry + " days" ];
				}
				break;

		}

		// No tags present means a passed test
		if( tags.length < 1 )
		{
			severity = this.resultTagToSeverity( { resultTag: CW_Constants.RESULT_PASS } );
			
			returnValue.result = CW_Constants.RESULT_PASS;
			// returnValue.printAnswer = "good".ok;
			
			returnValue.printDetail = "";

			serverArray.forEach(
				(server, index) =>
				{
					returnValue.printDetail += "'".text + server.result + "'".text;
					if( (index + 1) < serverArray.length )
					{
						returnValue.printDetail += ", ".text;
					}
				});
		}
		else // There was either a failure or a notification
		{
			returnValue.printSubject = "";
			returnValue.printAnswer = "failed".error;
			returnValue.printDetail = "";

			tags.forEach(
				tag =>
				{
					severity = this.resultTagToSeverity( { resultTag: tag.result_value, extraInput: tags } );

					// Handle direct messages, which are system/program errors
					if( severity == CW_Constants.SEVERITY_DIRECT_MESSAGE && tags[0].message != undefined && tags[0].message.length > 0 )
					{
						returnValue.printDetail += tags[0].message;
					}
					else  // lookup the content based on the info we have
					{
						returnValue.printDetail += this.contentForSeverity( { severity: severity, extraInput: tag.intermediate_key } ) + "\n";
					}

					// Notices
					if( severity == CW_Constants.SEVERITY_NOTICE )
					{
						returnValue.printAnswer = "warning".warn;
						serverArray.forEach(
							(server, index) =>
							{
								returnValue.printDetail += server.warn;
								if( (index + 1) < serverArray.length )
								{
									returnValue.printDetail += "\n";
								}
							});
						returnValue.printDetail = returnValue.printDetail.warn;

					}
					else if( severity == CW_Constants.SEVERITY_OK ) // "OK" conditions that may have extra output
					{
						returnValue.printAnswer = "good".ok;
						returnValue.printDetail = returnValue.printDetail.ok;
					}
					else // Errors (not a notice or "OK" with a tag)
					{
						returnValue.printDetail = returnValue.printDetail.error;
					}
				}
			);
		}

		// For live progress, display results on the screen
		if( returnType == "screen" )
		{
			process.stdout.write( returnValue.printAnswer + "\n" );
			process.stdout.write( returnValue.printSubject );
			if( returnValue.printDetail )
			{
				process.stdout.write( returnValue.printDetail + "\n" );
			}
			else
			{
				process.stdout.write( "\n" );
			}
		}
		else // or else, return the info we've gathered so the caller can process and respond
		{
			return returnValue;
		}
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
	 * // TODO: Have this run its data through inProgressAdvice instead of repeating the logic here
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
		let strings = require( "./strings/category.website-admin.js" );
		
		switch( severity )
		{
			case CW_Constants.SEVERITY_OK:
				if( extraInput && 
					undefined != (strings[ this.command ][ extraInput ][ CW_Constants.NAME_SEVERITY_OK ]) )
				{
					return strings[ this.command ][ extraInput ][ CW_Constants.NAME_SEVERITY_OK ];
				}
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