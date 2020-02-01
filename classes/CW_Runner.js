/**
 * Convenience class for running commands
 * 
 * @author costmo
 */
const CW_Network = require( "./CW_Network.js" );
const network = new CW_Network();

let CW_Constants = require( "./CW_Constants.js" );
let CW_Advice = require( "./CW_Advice.js" );

class CW_Runner
{
	/**
     * Create an instance
     * 
     * @author costmo
     */
    constructor()
    {
		
	}

	/**
	 * A maintained array of known commands for validation. If the requested command cannot be found,
	 *    returns "all"
	 * 
	 * @returns string
	 * @param {*} input		The command to sanitize 
	 */
	sanitizeCommand( input )
	{
		let returnValue = "all";

		// local: local-netowrk, local-dns
		// website-admin: http, https, domain
		// website: http-response, https-response, website, secure-website

		let validCommands = [ 
			"all", 
			"local-network", "local-dns", 
			"http", "https", "domain",
			"http-response", "https-response", "website", "secure-website" , 
		];

		if( validCommands.indexOf( input ) >= 0 )
        {
            returnValue = input;
		}
		
		return returnValue;
	}
	
	/**
	 * Run a command
	 * 
	 * TODO: input checking and delegating work to adaptors needs to negate the need to add to the validCommands array and add a new case
	 * @author costmo
	 * @param {*} command 			The command to run
	 * @param {*} configObject		An object holding the ingested configuration values
	 * @param {*} adviceObject			An instance of CW_Advice to pass down from the caller
	 */
	async runCommand( { command = "", configObject = null, adviceObject = null } )
    {
        // sanity check the requested command
		command = this.sanitizeCommand( command );

		if( !adviceObject )
		{
			adviceObject = new CW_Advice();
		}
		if( configObject )
		{
			adviceObject.configObject = configObject;
			adviceObject.domain = configObject.domain;
		}

		// TODO: remove this as soon as all commands are using adviceObject instead
		let responseObject = 
		{
			test: "",
			description: "",
			result: "",
			result_advice: "",
			response_time: -1,
			raw_response: "",
			status_code: "",
			redirect_location: ""
		};
		
		switch( command )
		{
			case "website":
				this.command_Website( { configObject: configObject, responseObject: responseObject, port: 80 } );
				break;
			case "secure-website":
				this.command_Website( { configObject: configObject, responseObject: responseObject, port: 443 } );
				break;
			case "local-network":
				this.command_LocalNetwork( { configObject: configObject, adviceObject: adviceObject } );
				break;
			case "local-dns":
				this.command_LocalDns( { configObject: configObject, adviceObject: adviceObject } );
				break;
			case "http":
				this.command_WebsiteAvailability( { configObject: configObject, responseObject: responseObject, port: 80 } );
				break;
			case "https":
				this.command_WebsiteAvailability( { configObject: configObject, responseObject: responseObject, port: 443 } );
				break;
			case "http-response":
				this.command_WebsiteResponse( { configObject: configObject, responseObject: responseObject, port: 80 } );
				break;
			case "https-response":
				this.command_WebsiteResponse( { configObject: configObject, responseObject: responseObject, port: 443 } );
				break;
			case "domain":
				this.command_Domain( { configObject: configObject, responseObject: responseObject } );
				break;
			case "all":
				console.log( "ALL not yet implemented" );
				break;
			default:
				// There's actually no way to get here unless the validCommands array is incorrect
				break;
		}

	} // runCommand()

	/**
	 * Below here should be convenience wrappers to get the content we want from working classes and coerce it for output
	 */

	/**
	 * Check website response/status code only
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} responseObject	A default response object
	 * @param {*} port				The port number we're checking
	 */
	command_WebsiteResponse( { configObject = null, responseObject =  null, port = 80 } )
	{
		responseObject.test = "http-reponse";
		responseObject.description = "Website response test";

		if( port == 443 )
		{
			responseObject.test = "https-reponse";
			responseObject.description = "Secure website response test";
		}

		CW_Runner.network.checkWebsiteResponse( { url: configObject.url, port: port } )
				.then(
					( result ) =>
					{
						responseObject.result = result.result;
						responseObject.result_advice = result.result_advice;
						responseObject.response_time = result.response_time;
						// responseObject.raw_response = result.raw_response; // skip this until we want/need to deal with JSON "circular references"
						responseObject.status_code = result.status_code;
						responseObject.redirect_location = result.redirect_location;

						console.log( JSON.stringify( responseObject ) );
					}
				);
	}
	

	/**
	 * Check website availability and response time only
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} responseObject	A default response object
	 * @param {*} port				The port number we're checking
	 */
	command_WebsiteAvailability( { configObject = null, responseObject =  null, port = 80 } )
	{
		responseObject.test = "http";
		responseObject.description = "Non-secure website availability test";

		if( port == 443 )
		{
			responseObject.test = "https";
			responseObject.description = "Secure website availability test";
		}

		CW_Runner.network.checkWebsiteAvailability( { domain: configObject.domain, port: port } )
				.then(
					( result ) =>
					{
						responseObject.result = result.result;
						responseObject.result_advice = result.result_advice;
						responseObject.response_time = result.response_time;
						responseObject.raw_response = result.raw_response;
						console.log( JSON.stringify( responseObject ) );
					}
				);
	}

	/**
	 * Make sure the local Internet connection can resolve a hostname
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} adviceObject		A constructed CW_Advice instance
	 */
	command_LocalDns( { configObject = null, adviceObject =  null } )
	{
		adviceObject.item_result.command = "local-dns";
		adviceObject.item_result.category = "local";

		CW_Runner.network.checkLocalDns()
			.then( 
				( result ) => 
				{
					// Handled in the same way as local-network
					adviceObject.item_result.result = result;
					adviceObject.item_result.result_tags.push( result );
					adviceObject.item_result.raw_response = result;

					adviceObject.test_result.results.push( adviceObject.item_result );
					adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

					console.log( JSON.stringify( adviceObject ) );
				});
	} // command_Dns

	/**
	 * Make sure the local network can reach the outside network by pinging an IP address that's know to never go down.
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} adviceObject			A constructed CW_Advice instance
	 */
	command_LocalNetwork( { configObject = null, adviceObject =  null } )
	{
		adviceObject.item_result.command = "local-network";
		adviceObject.item_result.category = "local";

		CW_Runner.network.checkLocalNetwork()
			.then( 
				( result ) => 
				{
					// result = "FAIL"; // Simulate a failure without shutting off your local network

					// `result` will either be PASS or FAIL. Nothing more meaningfiul is needed for this test
					adviceObject.item_result.result = result;
					adviceObject.item_result.result_tags.push( result );
					adviceObject.item_result.raw_response = result;

					adviceObject.test_result.results.push( adviceObject.item_result );
					adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

					// console.log( "\n" );
					console.log( JSON.stringify( adviceObject ) );
					// console.log( adviceObject );
					// console.log( "\n" );
					
				});
	} // command_localNetwork()

	/**
	  * Validate details of the user's domain name and registration
	  * 
	  * TODO: Refactor the completion blocks for maintainabiolity
	  * @author costmo
	  * @param {*} configObject				A parsed config object from JSON input
	  * @param {*} responseObject			A default response object
	  */
	 command_Domain( { configObject = null, responseObject =  null } )
	 {
		let async = require( "async" );
		let StringUtil = require( "./CW_StringUtil.js" );

		responseObject.test = "domain";
		responseObject.description = "Technical domain tests";

		responseObject.http_response_time = -1;
		responseObject.https_response_time = -1;
		responseObject.servers = new Object();
		responseObject.servers.ns = new Array(); // list of name servers
		responseObject.servers.tld_cname = new Array(); // list of cname records for @
		responseObject.servers.www_cname = new Array(); // list of cname records for www
		responseObject.servers.mx = new Array(); // list of Mail eXchange servers
		responseObject.servers.tld_a = new Array(); // list of A records for the domain
		responseObject.servers.www_a = new Array(); // list of A records for www.<domain>

 
		// Using ANY as the argument to dig is remarkably unreliable in retrieving complete records. 
		// The only way to get complete records reliably is to perform individual TYPE queries against an authoritative name server.
		async.waterfall(
			[
				( completion ) =>
				{
					// get nameserver records first so that we can get all the other data from an authority because non-authorities don't always answer completely
					CW_Runner.network.checkDomain( { domain: configObject.domain, recordType: "NS", queryServer: null } )
					.then(
						( result ) =>
						{
							result.forEach( 
								resultItem =>
								{
									responseObject.servers.ns.push( 
										StringUtil.stripTrailingDot( resultItem.value ) 
										);
								});
								completion( null, responseObject );
						}
					);
				},
				( result, completion ) => // Step 2. Parse the initial response and perform a dig query against an authoritative name server to get complete MX records fot the TLD
				{
					if( result.servers.ns.length > 0 && result.servers.ns[0].length > 0 )
					{
						result.servers.ns[0] = result.servers.ns[0];
					}
					else
					{
						// TODO: Reject or throw because there were no records
					}

					CW_Runner.network.checkDomain( { domain: configObject.domain, recordType: "MX", queryServer: result.servers.ns[0] } )
					.then(
						( result ) =>
						{
							result.forEach( 
								resultItem =>
								{
									responseObject.servers.mx.push( 
										StringUtil.stripTrailingDot( resultItem.value ) 
										);
								});
								completion( null, responseObject );
						}
					);

				},
				( result, completion ) => // Step 3. Perform a dig query against an authoritative name server to get an A record for the domain (should be the @ record)
				{
					CW_Runner.network.checkDomain( { domain: configObject.domain, recordType: "A", queryServer: result.servers.ns[0] } )
					.then(
						( result ) =>
						{
							// This happens if there is no CNAME record, which is OK if there is an A record
							if( undefined !== result )
							{
								result.forEach( 
									resultItem =>
									{
										responseObject.servers.tld_a.push( StringUtil.stripTrailingDot( resultItem.value ) );
									});
									completion( null, responseObject );
							}
						});
				},
				( result, completion ) => // Step 4. Perform a dig query against an authoritative name server to get an A record for the www.<domain> 
				{
					CW_Runner.network.checkDomain( { domain: configObject.url, recordType: "A", queryServer: result.servers.ns[0] } )
					.then(
						( result ) =>
						{
							if( undefined !== result )
							{
								// We should get a CNAME as the first response result and an A record as the second
								if( result.length > 1 )
								{
									result[0].value = StringUtil.stripTrailingDot( result[0].value )
									result[1].value = StringUtil.stripTrailingDot( result[1].value )

									
									if( (result[0].type == "CNAME" && result[1].type == "A") )
									{
										responseObject.servers.www_cname.push( result[0].value );
										responseObject.servers.www_a.push( result[1].value );
									}
									else if(result[0].type == "A" && result[1].type == "CNAME" ) // In theory, these can arrive in reverse order
									{
										responseObject.servers.www_cname.push( result[1].value );
										responseObject.servers.www_a.push( result[0].value );
									}
								}
								completion( null, responseObject );
							}
							else
							{
								completion( null, responseObject );
							}
						});
				},
				( result, completion ) => // Step 5. Perform a dig query against an authoritative name server to get a CNAME record for the URL
				{
					CW_Runner.network.checkDomain( { domain: configObject.url, recordType: "CNAME", queryServer: result.servers.ns[0] } )
					.then(
						( result ) =>
						{
							if( undefined !== result )
							{
								result.forEach( 
									resultItem =>
									{
										responseObject.servers.www_cname.push( StringUtil.stripTrailingDot( resultItem.value ) );
									});
									completion( null, responseObject );
							}
							else
							{
								completion( null, responseObject );
							}
						});
				},
				( result, completion ) => // Step 6. Perform a dig query against an authoritative name server to get a CNAME record for the domain
				{
					CW_Runner.network.checkDomain( { domain: configObject.domain, recordType: "CNAME", queryServer: result.servers.ns[0] } )
					.then(
						( result ) =>
						{
							// This should be undefined
							if( undefined !== result )
							{
								result.forEach( 
									resultItem =>
									{
										responseObject.servers.tld_cname.push( StringUtil.stripTrailingDot( resultItem.value ) );
									});
									completion( null, responseObject );
							}
							else
							{
								completion( null, responseObject );
							}
						});
				},
				( result, completion ) => // Step 7. Perform a whois lookup to get the domain expiration
				{
					CW_Runner.network.getWhoisInfo( { domain: configObject.domain } )
					.then(
						( result ) =>
						{
							responseObject.expiration = result;

							let parsedDate = Date.parse( responseObject.expiration );
							let now = Date.now();
							let timeDiff = Math.abs( now - parsedDate );
							let daysTilExpiry = Math.floor( timeDiff/(86400 * 1000) ); // '* 1000' because timeDiff is in microseconds

							responseObject.days_til_expiry = daysTilExpiry;

							completion( null, responseObject );
						});
				}
				// ( result, completion ) =>
				// {
				// }
			],
			( error, result ) =>
			{
				// TODO: Handle errors
				if( error )
				{
					console.log( "E" );
					console.log( error );
				}
				else
				{
					// Look over the results and offer some advice if necessary
					result.raw_response = result.servers;

					// TODO: Refactor Advice into its own class
					if( result.servers.ns.length < 1 )
					{
						result.result_advice += " Your domain does not have any name servers defined, so people will not be able to reach your website. Contact your website hosting provider.";
					}
					if( result.servers.tld_cname.length > 0 )
					{
						// TODO: make sure the only record(s) point to an IP address and not a domain name. It's normal for a dig query to receive an IP address here when there is no CNAME actually defined
						// result.result_advice += " Your domain name is currently configured as an alias (CNAME) to another address. This may not be a problem, but it isn't normal. You should contact your website hosting provider if you have a concern.";
					}

					if( result.servers.www_cname.length < 1 )
					{
						result.result_advice += " You have not configured a \"www\" address for people to reach your website. People may still be able to reach your website by not typing the \"www,\" but many Internet users expect URLs to begin with those characters and type them, even when they don't need to do so. To make sure you are maximising your traffic, you should contact your website hosting provider and have them add a \"CNAME\" record for your domain.";
					}
					else
					{
						let foundDomain = false;
						result.servers.www_cname.forEach(
							cname =>
							{
								if( cname == configObject.domain )
								{
									foundDomain = true;
								}
							}
						);
						if( !foundDomain )
						{
							result.result_advice += " Your \"www\" alias is not currently pointing to your top-level domain. This may not be a problem, but it isn't normal. You should contact your website hosting provider if you have a concern.";
						}
					}

					if( result.servers.mx.length < 1 )
					{
						result.result_advice += " You have not configured any Mail Exchange (MX) records. This means that people will not be able to send you email messages using your domain name. Contact your website or email hosting provider for more information.";
					}
					if( result.servers.tld_a.length < 1 )
					{
						result.result_advice += " Your domain name does not have its own \"A\" record in your domain's DNS records. This may not be a problem, but it isn't normal. You should contact your website hosting provider if you have a concern.";
					}
					if( result.servers.www_a.length > 0 ) // make sure the www "A" record matches the TLD record
					{
						let haveMatch = false;

						if( result.servers.tld_a.length > 0 )
						{
							result.servers.tld_a.forEach(
								server =>
								{
									// We're only trying to match against the first www A record. Having more than one would be weird.
									if( result.servers.www_a[0] == result.servers.tld_a[0] )
									{
										haveMatch = true;
									}
								}
							);
						}

						if( !haveMatch )
						{
							result.result_advice += " Your \"www\" DNS record does not match your domain's top-level IP address. This may not be a problem, but it isn't normal. You should contact your website hosting provider if you have a concern.";
						}
					}

					if( result.days_til_expiry < 91 )
					{
						if( result.days_til_expiry < 1 )
						{
							result.result_advice += " Your domain name has expired and people will not be able to reach your website. If you do not renew your domain name soon, their may be a large \"redemption\" fee. Contact your hosting provider immediately for assistance.";
						}
						else
						{
							result.result_advice += " Your domain name is going to expire in " + result.days_til_expiry + " days. If you do not renew your domain name, people will not be able to reach your website. Contact your hosting provider immediately for assistance.";
						}
					}

					if( result.result_advice.length < 1 )
					{
						result.result_advice = "none";
						result.result = "pass";
					}
					else
					{
						result.result = "advice";
					}
				}
				console.log( result );
			}
		);
		 
 

	 }

	/**
	 * Check website availability, response time and redirect status
	 * This wraps the 'website availability' and 'website response' checks into single chained request
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} responseObject	A default response object
	 * @param {*} port				The port number we're checking
	 */
	command_Website( { configObject = null, responseObject =  null, port = 80 } )
	{
		let async = require( "async" );

		// http(s), then http(s)-response
		responseObject.test = "website";
		responseObject.description = "Non-secure website availability and response test";

		if( port == 443 )
		{
			responseObject.test = "secure-website";
			responseObject.description = "Secure website availability and response test";
		}

		let outputObject = responseObject;

		async.waterfall(
			[
				( completion ) =>
				{
					CW_Runner.network.checkWebsiteAvailability( { domain: configObject.url, port: port } )
							.then(
								( result ) =>
								{
									responseObject.result = result.result;
									responseObject.result_advice = result.result_advice;
									responseObject.response_time = result.response_time;
									responseObject.raw_response = result.raw_response;

									outputObject = responseObject;
									completion( null, responseObject );
								}
							);
				},
				( result, completion ) =>
				{
					CW_Runner.network.checkWebsiteResponse( { url: configObject.url, port: port } )
							.then(
								( result ) =>
								{
									outputObject.result = result.result;
									outputObject.result_advice += " " + result.result_advice;
									responseObject.status_code = result.status_code;
									responseObject.redirect_location = result.redirect_location;

									console.log( JSON.stringify( responseObject ) );
									completion( null );
								}
							);
				}
			],
			( error ) =>
			{
				// TODO: Handle errors
				if( error )
				{
					console.log( error );
				}
			}
		);
	} // command_Website()

	/**
	 * Convenience getter of an instance of CW_Network
	 * 
	 * @author costmo
	 * @returns CW_Network
	 */
	static get network()
	{
		return network;
	}
}

module.exports = CW_Runner;