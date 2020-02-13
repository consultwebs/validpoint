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
		let returnValue = "all"; // "all" isn't (yet) implemented, actually

		// local: local-netowrk, local-dns
		// website-admin: http-port, https-port, domain
		// website: http-response, https-response, website, secure-website, website-content

		let validCommands = [ 
			"all", 
			"local-network", "local-dns", 
			"http-port", "https-port", "domain",
			"http-response", "https-response", "website", "secure-website",  "website-content"
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
		
		let connectionPort = 80;
		
		// Rejections have been resolved before getting back to here, so we only return resolved Promises
		switch( command )
		{
			case "website-content":
				return new Promise(
					(resolve, reject) =>
					{
						this.command_WebsiteContent( { configObject: configObject, adviceObject: adviceObject } )
						.then(
							(result) =>
							{
								resolve( result );
							}
						);
					}
				);
			case "website":
			case "secure-website":
				connectionPort = (command == "website") ? 80 : 443;
				return new Promise(
					(resolve, reject) =>
					{
						this.command_Website( { configObject: configObject, adviceObject: adviceObject, port: connectionPort } ) 
						.then(
							(result) =>
							{
								resolve( result );
							}
						);
					}
				);
			case "local-network":
				return new Promise(
					(resolve, reject) =>
					{
						this.command_LocalNetwork( { configObject: configObject, adviceObject: adviceObject } )
						.then(
							(result) =>
							{
								resolve( result );
							}
						);
					}
				);
			case "local-dns":
				return new Promise(
					(resolve, reject) =>
					{
						this.command_LocalDns( { configObject: configObject, adviceObject: adviceObject } )
						.then(
							(result) =>
							{
								resolve( result );
							}
						);
					}
				);
			case "http-port":
			case "https-port":
				connectionPort = (command == "http-port") ? 80 : 443;
				return new Promise(
					(resolve, reject) =>
					{
						this.command_WebsiteAvailability( { configObject: configObject, adviceObject: adviceObject, port: connectionPort } )
						.then(
							(result) =>
							{
								resolve( result );
							}
						);
					}
				);
			case "http-response":
			case "https-response":
				connectionPort = (command == "http-response") ? 80 : 443;
				return new Promise(
					(resolve, reject) =>
					{
						this.command_WebsiteResponse( { configObject: configObject, adviceObject: adviceObject, port: connectionPort } )
						.then(
							(result) =>
							{
								resolve( result );
							}
						);
					}
				);
			case "domain":
				// this.command_Domain( { configObject: configObject, adviceObject: adviceObject } );
				return new Promise(
					(resolve, reject) =>
					{
						this.command_Domain( { configObject: configObject, adviceObject: adviceObject } )
						.then(
							(result) =>
							{
								resolve( result );
							}
						);
					}
				);
			case "all":
				console.log( "ALL not yet implemented" );
				break;
			default:
				// There's actually no way to get here unless the validCommands array is incorrect
				break;
		}

	} // runCommand()

	/**
	 * Check website content for essential tags
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} adviceObject		A constructed CW_Advice instance
	 */
	command_WebsiteContent( { configObject = null, adviceObject =  null } )
	{
		adviceObject.item_result.command = "website-content";
		adviceObject.item_result.category = "website";

		return new Promise(
			async (resolve, reject) =>
			{
				try
				{
					let result = await CW_Runner.network.checkWebsiteContent( { url: configObject.url } );

					// Parse the incoming HTML to find important elements
					let HtmlParser = require( "node-html-parser" );
					let root = HtmlParser.parse( result );

					// Stuff some nodes into an object for testing
					adviceObject.item_result.raw_response = {
						headNode: root.querySelector( "head" ),
						titleNode:  root.querySelector( "head title" ),
						bodyNode:  root.querySelector( "body" ),
						h1Node:  root.querySelector( "h1" ),
						metaNodes:  root.querySelectorAll( "meta" )
					}

					adviceObject.test_result.results.push( adviceObject.item_result );
					adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

					// remove large result sets
					adviceObject.test_result.results.forEach(
						result =>
						{
							result.raw_response = "";
						}
					);

					resolve( JSON.stringify( adviceObject ) );
				}
				catch( error ) // There was an error getting the HTML of the page. Resolve the checker's rejection with a sane response
				{
					adviceObject.item_result.result = CW_Constants.RESULT_FAIL;
					adviceObject.item_result.result_tags.push( error );
					adviceObject.item_result.raw_response = error;

					adviceObject.test_result.results.push( adviceObject.item_result );
					adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

					resolve( JSON.stringify( adviceObject ) );
				}

			});
	}

	/**
	 * Below here should be convenience wrappers to get the content we want from working classes and coerce it for output
	 */

	/**
	 * Check website response/status code only
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} adviceObject		A constructed CW_Advice instance
	 * @param {*} port				The port number we're checking
	 */
	command_WebsiteResponse( { configObject = null, adviceObject =  null, port = 80 } )
	{
		adviceObject.item_result.command = "http-response";
		adviceObject.item_result.category = "website";

		if( port == 443 )
		{
			adviceObject.item_result.command = "https-response";
		}

		return new Promise(
			async (resolve, reject) =>
			{
				try
				{
					let result = await CW_Runner.network.checkWebsiteAvailability( { domain: configObject.url, port: port } );

					adviceObject.item_result.result = result.result;
					adviceObject.item_result.result_tags.push( result.result );
					adviceObject.item_result.raw_response = result;
					adviceObject.item_result.response_time = result.response_time;

					adviceObject.test_result.results.push( adviceObject.item_result );
					adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

					resolve( JSON.stringify( adviceObject ) );
				}
				catch( error )
				{
					// This is here as a formality. There is no condition that can cause the PromiseResolver to reject 
					//    other than a code or system error that would have prevented us reaching here in the first 
					//    place. e.g. "module 'tcp-ping' is not installed"

					adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } ); // Strip unwanted output objects from the return value. This will never add Advice since there will be nothing in the test_result array.
					resolve( JSON.stringify( adviceObject ) );
				}


			});
	}
	

	/**
	 * Check website availability and response time only
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} adviceObject		A constructed CW_Advice instance
	 * @param {*} port				The port number we're checking
	 */
	command_WebsiteAvailability( { configObject = null, adviceObject =  null, port = 80 } )
	{
		adviceObject.item_result.command = "http-port";
		adviceObject.item_result.category = "website-admin";

		if( port == 443 )
		{
			adviceObject.item_result.command = "https-port";
		}

		return new Promise(
			async (resolve, reject) =>
			{
				try
				{
					let result = await CW_Runner.network.checkWebsiteAvailability( { domain: configObject.domain, port: port } );

					adviceObject.item_result.result = result.result;
					adviceObject.item_result.result_tags.push( result.result );
					adviceObject.item_result.raw_response = result;
					adviceObject.item_result.response_time = result.response_time;
	
					adviceObject.test_result.results.push( adviceObject.item_result );
					adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );
	
					resolve( JSON.stringify( adviceObject ) );
				}
				catch( error ) // I don't think we'll be able to reach this catch naturally
				{
					adviceObject.item_result.result = CW_Constants.RESULT_FAIL;
					adviceObject.item_result.result_tags.push( error );
					adviceObject.item_result.raw_response = error;

					adviceObject.test_result.results.push( adviceObject.item_result );
					adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

					resolve( JSON.stringify( adviceObject ) );
				}

			});
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

		return new Promise(
			async (resolve, reject) =>
			{

				let result = await CW_Runner.network.checkLocalDns();

				// Handled in the same way as local-network
				adviceObject.item_result.result = result;
				adviceObject.item_result.result_tags.push( result );
				adviceObject.item_result.raw_response = result;

				adviceObject.test_result.results.push( adviceObject.item_result );
				adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

				resolve( JSON.stringify( adviceObject ) );

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

		return new Promise(
			async (resolve, reject) =>
			{

				let result = await CW_Runner.network.checkLocalNetwork();

				// `result` will either be PASS or FAIL. Nothing more meaningfiul is needed for this test
				adviceObject.item_result.result = result;
				adviceObject.item_result.result_tags.push( result );
				adviceObject.item_result.raw_response = result;

				adviceObject.test_result.results.push( adviceObject.item_result );
				adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

				resolve( JSON.stringify( adviceObject ) );

			});

	} // command_localNetwork()

	/**
	 * Completed the details of an Advice object for an error state
	 * 
	 * Abstracts repeated code from catch blocks
	 * 
	 * @author costmo
	 * @returns CW_Advice
	 * @param {*} adviceObject				An already constructed Advice instance
	 * @param {*} input						The input or error to add to the Advice object 
	 */
	constructErroredAdviceObject( { adviceObject = null, input = null } )
	{
		adviceObject.item_result.result = CW_Constants.RESULT_FAIL;
		adviceObject.item_result.raw_response = input;

		adviceObject.test_result.results.push( adviceObject.item_result );
		adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: false } );

		// delete adviceObject.domainResponses;

		return adviceObject;
	}

	/**
	  * Validate details of the user's domain name and registration
	  * 
	  * TODO: Refactor the completion blocks for maintainabiolity
	  * @author costmo
	  * @param {*} configObject				A parsed config object from JSON input
	  * @param {*} adviceObject		A constructed CW_Advice instance
	  */
	 command_Domain( { configObject = null, adviceObject = null } )
	 {
		let async = require( "async" );
		let StringUtil = require( "./CW_StringUtil.js" );

		adviceObject.item_result.command = "domain";
		adviceObject.item_result.category = "website-admin";

		// Add a custom structure to the adviceObject for domain responses since they hold a lot of info
		adviceObject.domainResponses = 
		{
			http_response_time: -1,
			https_response_time: -1,
			servers: 
			{
				ns: [],				// list of name servers
				tld_cname: [],		// list of cname records for @
				www_cname: [],		// list of cname records for www
				mx: [],				// list of Mail eXchange servers
				tld_a: [],			// list of A records for the domain
				www_a: []			// list of A records for www.<domain>
			}
		}

		return new Promise(
			(resolve, reject) =>
			{
				try
				{
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
												adviceObject.domainResponses.servers.ns.push( 
													StringUtil.stripTrailingDot( resultItem.value ) 
													);
											});

											completion( null, adviceObject );
									}
								)
								.catch( // resolve received rejections
									( error ) =>
									{
										resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
									}
								); 
							},
							( result, completion ) => // Step 2. Parse the initial response and perform a dig query against an authoritative name server to get complete MX records fot the TLD
							{
								CW_Runner.network.checkDomain( { domain: configObject.domain, recordType: "MX" } )
								.then(
									( result ) =>
									{
										result.forEach( 
											resultItem =>
											{
												adviceObject.domainResponses.servers.mx.push( 
													StringUtil.stripTrailingDot( resultItem.value ) 
													);
											});
											completion( null, adviceObject );
									}
								)
								.catch( // resolve received rejections
									( error ) =>
									{
										resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
									}
								);
							},
							( result, completion ) => // Step 3. Perform a dig query against an authoritative name server to get an A record for the domain (should be the @ record)
							{
								CW_Runner.network.checkDomain( { domain: configObject.domain, recordType: "A", queryServer: result.domainResponses.servers.ns[0] } )
								.then(
									( result ) =>
									{
										// This happens if there is no CNAME record, which is OK if there is an A record
										if( undefined !== result )
										{
											result.forEach( 
												resultItem =>
												{
													adviceObject.domainResponses.servers.tld_a.push( StringUtil.stripTrailingDot( resultItem.value ) );
												});
												completion( null, adviceObject );
										}
									})
									.catch( // resolve received rejections
										( error ) =>
										{
											resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
										}
									);
							},
							( result, completion ) => // Step 4. Perform a dig query against an authoritative name server to get an A record for the www.<domain> 
							{
								CW_Runner.network.checkDomain( { domain: configObject.url, recordType: "A", queryServer: result.domainResponses.servers.ns[0] } )
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
													adviceObject.domainResponses.servers.www_cname.push( result[0].value );
													adviceObject.domainResponses.servers.www_a.push( result[1].value );
												}
												else if(result[0].type == "A" && result[1].type == "CNAME" ) // In theory, these can arrive in reverse order
												{
													adviceObject.domainResponses.servers.www_cname.push( result[1].value );
													adviceObject.domainResponses.servers.www_a.push( result[0].value );
												}
											}
											completion( null, adviceObject );
										}
										else
										{
											completion( null, adviceObject );
										}
									})
									.catch( // resolve received rejections
										( error ) =>
										{
											resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
										}
									);
							},
							( result, completion ) => // Step 5. Perform a dig query against an authoritative name server to get a CNAME record for the URL
							{
								CW_Runner.network.checkDomain( { domain: configObject.url, recordType: "CNAME", queryServer: result.domainResponses.servers.ns[0] } )
								.then(
									( result ) =>
									{
										if( undefined !== result )
										{
											result.forEach( 
												resultItem =>
												{
													adviceObject.domainResponses.servers.www_cname.push( StringUtil.stripTrailingDot( resultItem.value ) );
												});
												completion( null, adviceObject );
										}
										else
										{
											completion( null, adviceObject );
										}
									})
									.catch( // resolve received rejections
										( error ) =>
										{
											resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
										}
									);
							},
							( result, completion ) => // Step 6. Perform a dig query against an authoritative name server to get a CNAME record for the domain
							{
								CW_Runner.network.checkDomain( { domain: configObject.domain, recordType: "CNAME", queryServer: result.domainResponses.servers.ns[0] } )
								.then(
									( result ) =>
									{
										// This should be undefined
										if( undefined !== result )
										{
											result.forEach( 
												resultItem =>
												{
													adviceObject.domainResponses.servers.tld_cname.push( StringUtil.stripTrailingDot( resultItem.value ) );
												});
												completion( null, adviceObject );
										}
										else
										{
											completion( null, adviceObject );
										}
									})
									.catch( // resolve received rejections
										( error ) =>
										{
											resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
										}
									);
							},
							( result, completion ) => // Step 7. Perform a whois lookup to get the domain expiration
							{
								CW_Runner.network.getWhoisInfo( { domain: configObject.domain } )
								.then(
									( result ) =>
									{
										let parsedDate = Date.parse( result );
										let now = Date.now();
										let timeDiff = Math.abs( now - parsedDate );
										let daysTilExpiry = Math.floor( timeDiff/(86400 * 1000) ); // '* 1000' because timeDiff is in microseconds

										adviceObject.domainResponses.expiration = result;
										adviceObject.domainResponses.days_til_expiry = daysTilExpiry;

										completion( null, adviceObject );
									})
									.catch( // resolve received rejections
										( error ) =>
										{
											resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
										}
									);
							}
						],
						( error, result ) =>
						{
							// Errors have been handled before here

							// Resolve the response
							adviceObject.item_result.raw_response = result.domainResponses;

							adviceObject.test_result.results.push( adviceObject.item_result );
							adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );
							delete adviceObject.domainResponses;
							delete adviceObject.whois_info;

							resolve( JSON.stringify( adviceObject ) );
						}
					);
				}
				catch( error )
				{
					// Each of the blocks above have their own catch, so this would only kick in if 
					//   we specifically add a throw (don't do that) or reject to a contained catch()
					//   (don't do that without good reason for breaking convention)

					// adviceObject.item_result.raw_response = error.message;
					// adviceObject.test_result.results.push( adviceObject.item_result );
					// adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );
					
					// resolve( JSON.stringify( adviceObject ) );
				}

			}); // new Promise()
	 }

	/**
	 * Check website availability, response time and redirect status
	 * This wraps the 'website availability' and 'website response' checks into single chained request
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} adviceObject		A constructed CW_Advice instance
	 * @param {*} port				The port number we're checking
	 */
	command_Website( { configObject = null, adviceObject =  null, port = 80 } )
	{
		let async = require( "async" );

		adviceObject.item_result.command = "website";
		adviceObject.item_result.category = "website";

		if( port == 443 )
		{
			adviceObject.item_result.command = "secure-website";
		}

		// wrap the entire waterfall in a promise
		return new Promise(
			(resolve, reject) =>
			{
				// TODO: This needs to be abstracted from the input of Promise(). That there's way too much code to be an input
				async.waterfall(
					[
						( completion ) =>
						{
							CW_Runner.network.checkWebsiteAvailability( { domain: configObject.url, port: port } )
								.then(
									( result ) =>
									{
										try
										{
											adviceObject.item_result.result = result.result;
											adviceObject.item_result.result_tags.push( result.result );
											adviceObject.item_result.raw_response = result;
											adviceObject.item_result.response_time = result.response_time;
					
											adviceObject.test_result.results.push( adviceObject.item_result );
											adviceObject.finalizeOutput( { stripConfigObject: false, stripItemResult: false } );
		
											// only run part 2 if we got a PASS or UNTESTED
											if( adviceObject.item_result.result == CW_Constants.RESULT_PASS ||
												adviceObject.item_result.result == CW_Constants.RESULT_UNTESTED )
												{
													completion( null, adviceObject );
												}
												else // If there was a failure, we're not moving on to the next step, so sanitize the output and resolve early with a FAIL
												{
													if( adviceObject.configObject )
													{
														delete adviceObject.configObject;
													}
													delete adviceObject.item_result;
													resolve( JSON.stringify( adviceObject ) );
												}
										}
										catch( error ) // Not sure this can ever be reached
										{
											adviceObject.item_result.result = result.result;
											adviceObject.item_result.result_tags.push( result.result );
											adviceObject.item_result.raw_response = result;
											adviceObject.item_result.response_time = result.response_time;
					
											adviceObject.test_result.results.push( adviceObject.item_result );
											adviceObject.finalizeOutput( { stripConfigObject: false, stripItemResult: false } );

											if( adviceObject.configObject )
											{
												delete adviceObject.configObject;
											}
											delete adviceObject.item_result;
											resolve( JSON.stringify( adviceObject ) );
										}

									}
								);
						},
						( result, completion ) =>
						{
							CW_Runner.network.checkWebsiteResponse( { url: configObject.url, port: port } )
								.then(
									( result ) =>
									{
										adviceObject.item_result.result = result.result;
										adviceObject.item_result.result_tags.push( result.result );
										adviceObject.item_result.raw_response = result;
										adviceObject.item_result.response_time = result.response_time;
				
										adviceObject.test_result.results.push( adviceObject.item_result );
										adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );
	
										completion( null, JSON.stringify( adviceObject ) );
									}
								).catch(
									error =>
									{
										adviceObject.item_result.result = error.result;
										adviceObject.item_result.result_tags.push( error.result );
										adviceObject.item_result.raw_response = error.raw_response;
										adviceObject.item_result.response_time = error.response_time;
				
										adviceObject.test_result.results.push( adviceObject.item_result );
										adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

										resolve( JSON.stringify( adviceObject ) );
									}
								);
						}
					],
					( error, result ) =>
					{
						// Errors have all been caught and handled prior to here
						resolve( result ); // resolve the final answer
					}
				); // async.waterfall

			}); // new Promise()

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

	static processinputArguments()
	{
		let returnValue =
		{
			command: "",
			domain: ""
		};

		// TODO: If there's a command and no domain, run the command for all domains
		// TODO: If there's a domain and no command, run all commands for the domain
		// TODO: If there is not a domain or a command, show the help screen
		// TODO: Request help from a module call

		// parse the requested command from the command line arguments, then run the command
		let yargs = require( "yargs" );
		yargs.scriptName( "./bin/Validpoint" )
			.usage( "USAGE: $0 <command> -d [domain1,[domain2,...]] [-f file] [-c configFile] [-h]" )
			.version( "0.0.1" )
			.option( "d",
			{
				alias: "domain",
				describe: "The domain name or a comma-delimited list of domain names",
				demand: false,
				type: "string",
				nargs: 1
			} )
			.option( "f",
			{
				alias: "file",
				describe: "A file or directory for test input",
				demand: false,
				type: "string",
				conflicts: [ "d" ] // Don't allow users to specify a file or directory for input AND a domain to test
			} )
			.option( "c",
			{
				alias: "config",
				describe: "A JSON file for test-run configuration",
				demand: false,
				type: "string"
			} )
			.option( "h",
			{
				alias: "help",
				describe: "Show this help screen", // This doesn't have any effect
				demand: false
			})
			.command( "$0", "Unknown command supplied", // If the user typed a command that we do not know how to handle, show the help screen and exit
				() => {},
				( argv ) =>
				{
					console.log( "Unknown command: " + argv._["0"] );
					yargs.showHelp();
					process.exit( 1 );
				}
			)
			.command( "local-network", "Test local network connectivity" )
			.command( "local-dns", "Test local DNS resolution" )
			.command( "http-port", "Test response time of web server port 80" )
			.command( "https-port", "Test response time of web server port 443" )
			.command( "domain", "Test domain registrar configuration" )
			.command( "http-response", "Test response code and redirection for http" )
			.command( "https-response", "Test response code and redirection for https" )
			.command( "website", "Combined test of http-port and http-response" )
			.command( "secure-website", "Combined test of https-port and https-response" )
			.command( "website-content", "Test website content for essential content" )
			.demandCommand( 1, "You must specify a command to run" )
			.help( "help",  "Show this help screen" )
			.argv;

		returnValue.command = yargs.argv._[0];
		returnValue.domain = yargs.argv.domain;

		return returnValue;
	}
}

module.exports = CW_Runner;