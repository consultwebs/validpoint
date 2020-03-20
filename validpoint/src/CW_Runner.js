/**
 * Convenience class for running commands
 * 
 * @author costmo
 */
const CW_Network = require( "./CW_Network" );
const network = new CW_Network();

let CW_Constants = require( "./CW_Constants" );
let CW_Advice = require( "./CW_Advice" );
let AdviceContent = require( "../dist/CW_AdviceContent" );

let async = require( "../node_modules/async" );

const colors = require( "../node_modules/colors" );

// TODO: Running "all" commands causes the headers to be printed first, then the results - get them (a)synced up

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
	 * A maintained array of known commands for validation.
	 * 
	 * @returns string
	 * @param {*} input		The command to sanitize 
	 */
	sanitizeCommand( input )
	{
		let returnValue = "";

		if( CW_Constants.VALID_COMMANDS.indexOf( input ) >= 0 || input == "all" )
        {
            returnValue = input;
		}
		
		return returnValue;
	}

	/**
	 * Parse input for this domain to get an array of commands to run
	 */
	static parseInputForCommands( {domain = null, input = null, arrayIndex = -1} )
	{
		let cmds = {};


		// Override commands from config/input
		if( Array.isArray( input.domain ) )
		{
			if( input.domain[arrayIndex].preflight_commands && 
				Object.keys( input.domain[arrayIndex].preflight_commands ).length > 0 )
			{
				cmds = input.domain[arrayIndex].preflight_commands;
			}

			if( input.domain[arrayIndex].commands && 
				Object.keys( input.domain[arrayIndex].commands ).length > 0 )
			{
				// If there were no preflight commands, override any previously specified commands
				if( !input.domain[arrayIndex].preflight_commands || 
					Object.keys( input.domain[arrayIndex].preflight_commands ).length < 1 )
				{
					cmds = input.domain[arrayIndex].commands;
				}
				else // or else add to the preflight commands
				{
					cmds = Object.assign( cmds, input.domain[arrayIndex].commands );
				}
			}

			
		}
		else if( input.domain[domain] && Object.keys( input.domain[domain] ).length > 0 )
		{
			if( input.domain[domain].preflight_commands && 
				Object.keys( input.domain[domain].preflight_commands ).length > 0 )
			{
				cmds = input.domain[domain].preflight_commands;
			}

			if( input.domain[domain].commands && 
				Object.keys( input.domain[domain].commands ).length > 0 )
			{
				// If there were no preflight commands, override any previously specified commands
				if( !input.domain[domain].preflight_commands || 
					Object.keys( input.domain[domain].preflight_commands ).length < 1 )
				{
					cmds = input.domain[domain].commands;
				}
				else // or else add to the preflight commands
				{
					cmds = Object.assign( cmds, input.domain[domain].commands );
				}
			}
		}

		return cmds;
	}

	/**
	 * Final normaliztion of domain and other input for processing
	 * @param {*} param0 
	 */
	static normalizeInput( {domain = null, domains = null, input = null} )
	{
		return new Promise(
			(resolve, reject) =>
			{
				let CW_InputParser = require( "./CW_InputParser" );

				let domainOut = domain;
				if( domain == 0 )
				{
					domainOut = domains[0];
					input.domain[domain] = {};
				}
				else if( typeof domain === "object" )
				{
					domainOut = domain.domain;
				}

				// No configuration input JSON
				if( undefined === input.domain[domainOut] )
				{
					input.domain[domainOut] = {};
				}

				let configUrl = (input.domain[domainOut].url) ? input.domain[domainOut].url : "www." + domainOut;
				let configName = (input.domain[domainOut].name) ? input.domain[domainOut].name : domainOut;
				
				if( !input.domain[domainOut].commands )
				{
					input.domain[domainOut].commands = input.command;
				}

				if( input.domain[domainOut].preflight_commands && input.domain[domainOut].preflight_commands.length > 0 )
				{
					input.domain[domainOut].commands = input.domain[domainOut].preflight_commands.concat( input.domain[domainOut].commands );
				}

				input.domain[domainOut] = 
				{ ...input.domain[domainOut],
					url: configUrl,
					name: configName
				};

				let returnValue = 
				{
					domain: domainOut,
					url: configUrl,
					name: configName,
					input: input
				};

				// Get input from the an input JSON file if one exists for the domain
				let parser = new CW_InputParser( domainOut + ".json", "./" );
				parser.init(
					function()
					{
						try
						{
							let config = this.parseJsonString();

							// The output node doesn't yet exist - make it
							if( !returnValue.input.domain[domainOut] )
							{
								returnValue.input.domain[domainOut] = {};
							}

							// Override already grabbed-values from JSON input for the domain
							if( config.name && config.name.length > 0 )
							{
								returnValue.input.domain[domainOut].name = config.name;
							}
							if( config.domain && config.domain.length > 0 )
							{
								returnValue.input.domain[domainOut].domain = config.domain;
							}
							else
							{
								returnValue.input.domain[domainOut].domain = domainOut;
							}
							if( config.url && config.url.length > 0 )
							{
								returnValue.input.domain[domainOut].url = config.url;
							}

							if( (config.preflight_commands && Object.keys( config.preflight_commands ).length > 0) ||
								(config.commands && Object.keys( config.commands ).length > 0) )
							{
								returnValue.input.domain[domainOut].commands = {};
							}

							// Override preflight commands and commands
							if( config.preflight_commands && Object.keys( config.preflight_commands ).length > 0 )
							{
								returnValue.input.domain[domainOut].commands = Object.assign( {}, config.preflight_commands );
							}
							if( config.commands && Object.keys( config.commands ).length > 0 )
							{
								returnValue.input.domain[domainOut].commands = Object.assign( returnValue.input.domain[domainOut].commands, config.commands );
							}

							resolve( returnValue );
						}
						catch( error )
						{
							// File does not exist, which means we won't override the input - no error condition here
							resolve( returnValue );
						}
					}
				);
			}
		);
	}

	/**
	 * Parse input for this run to get an array of domain names or domain objects
	 */
	static parseInputForDomains( {input = null} )
	{
		let domains = input.domain;
		let inputDirectory = null;

		// normalize the input directory
		if( input.directory && input.directory.length > 0 )
		{
			inputDirectory = input.directory;
		}
		input.inputDirectory = inputDirectory;

		// There were no input options and no config file input
		// Show the help screen and stop
		if( !domains || 
			(domains.length == 1 && domains[0] === undefined) )
		{
			console.log();
			console.log( "You must specify a domain with '-d <domain>', supply an input configuration file, or have a validpoint.json file in the current directory." );
			console.log();

			let yargs = CW_Runner.getYargs();
			yargs.showHelp();
			process.exit();
		}

		// Convert Object input to an array of objects
		if( !Array.isArray( domains ) )
		{
			let tmpOutput = [];
			Object.keys( domains ).forEach(
				(domain, index) =>
				{
					tmpOutput.push( domain );
				}
			);
			domains = tmpOutput;
		}

		return domains;
	}

	static printDomainHeadline( {config = null, domain = null} )
	{
		return new Promise( 
			(resolve, reject) =>
			{
				let configName = domain;
				if( config.domain[configName] && config.domain[configName].name && config.domain[configName].name.length > 0 )
				{
					configName = config.domain[configName].name;
				}
				AdviceContent.progressTitle( { configObject: config, input: "\nBeginning tests for " + configName + "...   \n" } );
				resolve( true );
			}
		);
	}

	static domainCommandRunner( {input = null})
	{
		return new Promise(
			async (resolve, reject) =>
			{
				let domain = input.domain;
				// TODO: Validate that this has already been normalized, then remove this test
				if( typeof domain === "object" )
				{
					domain = input.domain.domain;
				}
				let cmds = input.inputOptions.domain[domain].commands;
				let config = input.inputOptions.domain[domain];

				// TODO: Get input options from "-i " one level above this

				let CW_Advice = require( "../dist/CW_Advice.js" );
				let runner = new CW_Runner();

				if( cmds )
				{
					async.eachSeries(
						Object.keys( cmds ),
						async (command) =>
						{
							let advice = new CW_Advice();
							await runner.commandResolutionWrapper( { command: command, configObject: config, adviceObject: advice } );
						},
						(error) =>
						{
							// TODO: Test to see if we can get an error here, otherwise always reolve `true` because we'll only end up here at the end of the commands
							resolve( true );
						}); // end async.eachSeries for cmds
				}
			},
			(error) =>
			{
				// TODO: Test to see if we can reach here
				console.log( "Outside callback with error: " );
				console.log( error );
			}
		);
	}

	// Abstract command Promises so that the first returned Promise doesn't end a loop
	commandResolutionWrapper( { command: command, configObject: config, adviceObject: advice } )
	{
		return new Promise(
			(resolve, reject) =>
			{
				this.runCommand( { command: command, configObject: config, adviceObject: advice } )
				.then(
					( response ) =>
					{

						// TODO: Show the response at the console if "-r" is set
						resolve( response );
					}
				)
				.catch(
					(error) =>
					{
						// TODO: Test to see if we can reach here
						console.log( "Error resolving command: " );
						console.log( error );
					}
				);
			}
		);
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
	runCommand( { command = "", configObject = null, adviceObject = null } )
    {
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
			case "all-website-content":
				return new Promise(
					(resolve, reject) =>
					{
						this.command_AllWebsiteContent( { configObject: configObject, adviceObject: adviceObject } )
						.then(
							(result) =>
							{
								resolve( result );
							}
						);
					}
				);
			case "ssl":
				return new Promise(
					(resolve, reject) =>
					{
						this.command_SSL( { configObject: configObject, adviceObject: adviceObject } )
						.then(
							(result) =>
							{
								resolve( result );
							}
						);
					}
				);
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
			default: // Command not found, look in the registry
				return new Promise(
					(resolve, reject) =>
					{
						let currentDir = process.cwd();
						let packageJsonPath =  currentDir+ "/package.json";

						var readJson = require( "read-package-json" );
						readJson( packageJsonPath, console.error, false,
							async ( error, data ) =>
							{
								if( error )
								{
									// There's no package.json? Weird, but it just means we don't have any addons to consider
								}
								else
								{
									const fs = require( "fs" );
									
									if( data && data.validpoint && data.validpoint.addons && data.validpoint.addons.length > 0 )
									{
										let foundCommand = false;
										await data.validpoint.addons.forEach(
											( addon ) =>
											{
												let registryFilePath = currentDir + "/node_modules/" + addon + "/validpoint.registry.js";

												try
												{
													if( fs.existsSync( registryFilePath ) )
													{
														let addonRegistry = require( registryFilePath );
														if( addonRegistry[command] && addonRegistry[command].handler )
														{
															foundCommand = true;
															let handlerInput = 
															{
																"domain":  configObject.domain,
																"url": configObject.url,
																"input": configObject.input
															};
															resolve( addonRegistry[command].handler( {input: handlerInput} ) );
														}
													}
												}
												catch( error )
												{
													// File doesn't exists - this means there's no registry, not a system error that requires error handling
													// console.log( "ERROR:" ); // TODO: See if it is appropriate to exit silently
													// console.log( error );
												}
											}
										);

										if( !foundCommand )
										{
											resolve( JSON.stringify( { "error": "Could not find command: " + command} ) );
										}
									}
								}
							} );
					}
				);
				
				// There's actually no way to get here unless the validCommands array is incorrect
				break;
		}

	} // runCommand()

	/**
	 * Check a server's SSl certificate
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} adviceObject		A constructed CW_Advice instance
	 */
	command_SSL( { configObject = null, adviceObject =  null } )
	{
		adviceObject.item_result.command = "ssl";
		adviceObject.item_result.category = "website";

		return new Promise(
			( resolve, reject ) =>
			{
				let AdviceContent = require( "./CW_AdviceContent" );

				AdviceContent.progressContent( { configObject: configObject,
					input: "Retrieving SSL certificate information for ".header + configObject.url.subject + "...   ".header 
				});

				CW_Runner.network.checkSSL( { url: configObject.url } )
					.then(
						(result) =>
						{
							AdviceContent.progressContent( { configObject: configObject,
								input: "done\n".ok 
							});

							adviceObject.item_result.result = result.status;
							adviceObject.item_result.result_tags.push( result.status );
							adviceObject.item_result.raw_response = result;

							AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "SSL" } );

							adviceObject.test_result.results.push( adviceObject.item_result );
							adviceObject.finalizeOutput( { stripConfigObject: false, stripItemResult: true } );

							CW_Runner.network.checkSSLExpiration( { url: configObject.url } )
								.then(
									(result) =>
									{
										AdviceContent.progressContent( { configObject: configObject,
											input: "Checking SSL certificate expiration...   ".header 
										});

										adviceObject.item_result = {
											command: "ssl",
											category: "website",
											result_tags: []
										};


										adviceObject.item_result.result = result.status;
										adviceObject.item_result.result_tags.push( result.status );
										adviceObject.item_result.raw_response = result;

										AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "SSL_EXPIRATION" } );

										adviceObject.test_result.results.push( adviceObject.item_result );
										adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

										resolve( JSON.stringify( adviceObject ) );
									}
								);

							// TODO: Output advice for non-progressive output
							// resolve( JSON.stringify( adviceObject ) );
						}
					);





			});
	}

	/**
	 * Returns all website content for external processing
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} adviceObject		A constructed CW_Advice instance
	 */
	command_AllWebsiteContent( { configObject = null, adviceObject =  null } )
	{
		return new Promise(
			(resolve, reject) =>
			{
				CW_Runner.network.checkWebsiteContent( { url: configObject.url } )
					.then(
						( result ) =>
						{
							resolve( result );
						}
					);
			});
	}

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
			(resolve, reject) =>
			{
				let AdviceContent = require( "./CW_AdviceContent" );

				AdviceContent.progressContent( { configObject: configObject,
					input: "\nDownloading content for  ".header + configObject.url.subject + "...   ".header 
				});

				try
				{
					CW_Runner.network.checkWebsiteContent( { url: configObject.url } )
						.then(
							( result ) =>
							{
								AdviceContent.progressContent( { configObject: configObject,
									input: "done\n".ok 
								});

								// Parse the incoming HTML to find important elements
								let HtmlParser = require( "../node_modules/node-html-parser" );
								let root = HtmlParser.parse( result );

								// Stuff some nodes into an object for testing
								adviceObject.item_result.raw_response = {
									headNode: root.querySelector( "head" ),
									titleNode:  root.querySelector( "head title" ),
									bodyNode:  root.querySelector( "body" ),
									h1Node:  root.querySelector( "h1" ),
									metaNodes:  root.querySelectorAll( "meta" )
								}

								AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "WEBSITE_CONTENT" } );

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
						)
						.catch(
							( error ) =>
							{
								resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
							}
						);


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
			(resolve, reject) =>
			{
				let AdviceContent = require( "./CW_AdviceContent" );

				AdviceContent.progressContent( { configObject: configObject,
					input: "\nChecking port " + port.toString().subject + " response code for ".header + configObject.url.subject + "...   ".header 
				});

				CW_Runner.network.checkWebsiteAvailability( { domain: configObject.url, port: port } )
					.then(
						( result ) =>
						{
							AdviceContent.progressContent( { configObject: configObject,
								input: "done\n".ok 
							});

							adviceObject.item_result.result = result.result;
							adviceObject.item_result.result_tags.push( result.result );
							adviceObject.item_result.raw_response = result;
							adviceObject.item_result.response_time = result.response_time;

							AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "WEBSITE_RESPONSE" } );
		
							adviceObject.test_result.results.push( adviceObject.item_result );
							adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );
		
							resolve( JSON.stringify( adviceObject ) );
						}
					)
					.catch(
						( error ) =>
						{
							resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
						}
					);
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
			(resolve, reject) =>
			{
				let AdviceContent = require( "./CW_AdviceContent" );

				AdviceContent.progressContent( { configObject: configObject,
					input: "Checking port " + port.toString().subject + " availability for ".header + configObject.url.subject + "...   ".header 
				});

				try
				{
					CW_Runner.network.checkWebsiteAvailability( { domain: configObject.domain, port: port } )
						.then(
							(result) =>
							{
								AdviceContent.progressContent( { configObject: configObject,
									input: "done".ok 
								});

								adviceObject.item_result.result = result.result;
								adviceObject.item_result.result_tags.push( result.result );
								adviceObject.item_result.raw_response = result;
								adviceObject.item_result.response_time = result.response_time;

								AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "WEBSITE_AVAILABILITY" } );

								adviceObject.test_result.results.push( adviceObject.item_result );
								adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );
				
								resolve( JSON.stringify( adviceObject ) );
							}).catch(
								( error ) =>
								{
									resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
								}
							);
				}
				catch( error ) // We won't be able to reach this catch naturally
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
			(resolve, reject) =>
			{	
				let AdviceContent = require( "./CW_AdviceContent" );

				CW_Runner.network.checkLocalDns()
					.then(
						( result ) =>
						{
							AdviceContent.progressContent( { configObject: configObject,
								input: "Checking Internet name resolution...   ".header 
							});

							// Handled in the same way as local-network
							adviceObject.item_result.result = result;
							adviceObject.item_result.result_tags.push( result );
							adviceObject.item_result.raw_response = result;

							AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "LOCAL_DNS" } );

							adviceObject.test_result.results.push( adviceObject.item_result );
							adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

							resolve( JSON.stringify( adviceObject ) );
						}
					)
					.catch(
						( error ) =>
						{
							AdviceContent.progressContent( { configObject: configObject,
								input: "Internet name resolution failed...   ".error 
							});
							resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
						}
					);



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
			(resolve, reject) =>
			{
				let AdviceContent = require( "./CW_AdviceContent" );


				CW_Runner.network.checkLocalNetwork()
					.then(
						( result ) =>
						{	
							AdviceContent.progressContent( { configObject: configObject,
								input: "Checking local network connectivity...   ".header 
							});

							// `result` will either be PASS or FAIL. Nothing more meaningfiul is needed for this test
							adviceObject.item_result.result = result;
							adviceObject.item_result.result_tags.push( result );
							adviceObject.item_result.raw_response = result;

							AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "LOCAL_NETWORK" } );

							adviceObject.test_result.results.push( adviceObject.item_result );
							adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

							resolve( JSON.stringify( adviceObject ) );
						}
					)
					.catch(
						( error ) =>
						{
							AdviceContent.progressContent( { configObject: configObject,
								input: "Local network connectivity test failed...   ".error 
							});
							resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
						}
					);



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

		return adviceObject;
	}

	/**
	  * Validate details of the user's domain name and registration
	  * 
	  * TODO: Refactor the completion blocks for maintainability
	  * @author costmo
	  * @param {*} configObject				A parsed config object from JSON input
	  * @param {*} adviceObject		A constructed CW_Advice instance
	  */
	  command_Domain( { configObject = null, adviceObject = null } )
	 {
		let StringUtil = require( "./CW_StringUtil.js" );
		let AdviceContent = require( "./CW_AdviceContent.js" );

		AdviceContent.progressContent( { configObject: configObject,
			input: "Beginning domain tests for ".text + configObject.domain.header + "...   \n".text 
		});

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
								
								AdviceContent.progressContent( { configObject: configObject,
									input: "Testing name server records for ".header + configObject.domain.subject + "...   ".header 
								});

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

											AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "NS" } );
											
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
								AdviceContent.progressContent( { configObject: configObject,
									input: "Testing mail server records for ".header + configObject.domain.subject + "...   ".header
								});

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

											AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "MX" } );
											
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
								AdviceContent.progressContent( { configObject: configObject,
									input: "Testing \"A\" records for domain ".header + configObject.domain.subject + "...   ".header
								});

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

												AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "TLD_A" } );
												
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
								AdviceContent.progressContent( { configObject: configObject,
									input: "Testing \"A\" records for URL ".header + configObject.url.subject + "...   ".header
								});

								CW_Runner.network.checkDomain( { domain: configObject.url, recordType: "A", queryServer: result.domainResponses.servers.ns[0] } )
								.then(
									( result ) =>
									{
										if( undefined !== result )
										{
											// We "should" get a CNAME as the first response result and an A record as the second
											if( result.length > 1 )
											{
												result[0].value = StringUtil.stripTrailingDot( result[0].value )
												result[1].value = StringUtil.stripTrailingDot( result[1].value )

												if( (result[0].type == "CNAME" && result[1].type == "A") ) // In theory, these can arrive in reverse order
												{
													adviceObject.domainResponses.servers.www_cname.push( result[0].value );
													adviceObject.domainResponses.servers.www_a.push( result[1].value );
												}
												else if(result[0].type == "A" && result[1].type == "CNAME" )
												{
													adviceObject.domainResponses.servers.www_cname.push( result[1].value );
													adviceObject.domainResponses.servers.www_a.push( result[0].value );
												}
											}

											AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "WWW_A" } );

											completion( null, adviceObject );
										}
										else
										{
											AdviceContent.progressContent( { configObject: configObject,
												input: "No \"A\" record found for \"WWW.\" This is acceptable\n".ok
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
							( result, completion ) => // Step 5. Perform a dig query against an authoritative name server to get a CNAME record for the URL
							{
								AdviceContent.progressContent( { configObject: configObject,
									input: "Testing \"CNAME\" records for URL ".header + configObject.url.subject + "...   ".header
								});

								CW_Runner.network.checkDomain( { domain: configObject.url, recordType: "CNAME", queryServer: result.domainResponses.servers.ns[0] } )
								.then(
									( result ) =>
									{
										if( undefined !== result )
										{
											result.forEach( 
												resultItem =>
												{
													if( resultItem.value && resultItem.value.length > 0 )
													{
														adviceObject.domainResponses.servers.www_cname.push( StringUtil.stripTrailingDot( resultItem.value ) );
													}
												});

												AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "WWW_CNAME" } );

												completion( null, adviceObject );
										}
										else
										{
											AdviceContent.progressContent( { configObject: configObject,
												input: "No \"CNAME\" record found for \"WWW.\" This is acceptable\n".ok
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
							( result, completion ) => // Step 6. Perform a dig query against an authoritative name server to get a CNAME record for the domain
							{
								AdviceContent.progressContent( { configObject: configObject,
									input: "Testing \"CNAME\" records for domain ".header + configObject.domain.subject + "...   ".header
								});

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
													// It's OK to not get a cname response
													if( resultItem.value )
													{
														adviceObject.domainResponses.servers.tld_cname.push( StringUtil.stripTrailingDot( resultItem.value ) );
													}
												});

												AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "TLD_CNAME" } );

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
								AdviceContent.progressContent( { configObject: configObject,
									input: "Testing domain registration details for ".header + configObject.domain.subject + "...   \n".header
								});

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

										AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "WHOIS" } );

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
		let async = require( "../node_modules/async" );
		let AdviceContent = require( "./CW_AdviceContent.js" );

		adviceObject.item_result.command = "website";
		adviceObject.item_result.category = "website";

		if( port == 443 )
		{
			adviceObject.item_result.command = "secure-website";
		}

		AdviceContent.progressContent( { configObject: configObject,
			input: "\nChecking website availability for  ".header + configObject.url.subject + " on port " + port.toString().subject + "...   ".header 
		});

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
										AdviceContent.progressContent( { configObject: configObject,
											input: "done\n".ok 
										});
										try
										{
											adviceObject.item_result.result = result.result;
											adviceObject.item_result.result_tags.push( result.result );
											adviceObject.item_result.raw_response = result;
											adviceObject.item_result.response_time = result.response_time;

											AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "WEBSITE_AVAILABILITY" } );
					
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
								)
								.catch(
									( error ) =>
									{
										resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
									}
								);
						},
						( result, completion ) =>
						{
							AdviceContent.progressContent( { configObject: configObject,
								input: "\nChecking website response for  ".header + configObject.url.subject + " on port " + port.toString().subject + "...   ".header 
							});

							CW_Runner.network.checkWebsiteResponse( { url: configObject.url, port: port } )
								.then(
									( result ) =>
									{
										AdviceContent.progressContent( { configObject: configObject,
											input: "done\n".ok 
										});

										adviceObject.item_result.result = result.result;
										adviceObject.item_result.result_tags.push( result.result );
										adviceObject.item_result.raw_response = result;
										adviceObject.item_result.response_time = result.response_time;

										AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "WEBSITE_RESPONSE" } );
				
										adviceObject.test_result.results.push( adviceObject.item_result );
										adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );
	
										completion( null, JSON.stringify( adviceObject ) );
									}
								).catch(
									error =>
									{
										AdviceContent.progressContent( { configObject: configObject,
											input: "done\n".ok 
										});

										// Resolve a throw from a system error...
										if( error.raw_response && error.raw_response.message && error.raw_response.message.length > 0 )
										{
											resolve( JSON.stringify( this.constructErroredAdviceObject( { adviceObject: adviceObject, input: error } ) ) );
										}
										else // ...or a rejection from a test error
										{
											adviceObject.item_result.result = error.result;
											adviceObject.item_result.result_tags.push( error.result );
											adviceObject.item_result.raw_response = error.raw_response;
											adviceObject.item_result.response_time = error.response_time;

											AdviceContent.progressAdvice( { configObject: configObject, adviceObject: adviceObject, testKey: "WEBSITE_RESPONSE" } );
					
											adviceObject.test_result.results.push( adviceObject.item_result );
											adviceObject.finalizeOutput( { stripConfigObject: true, stripItemResult: true } );

											resolve( JSON.stringify( adviceObject ) );
										}
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

	static getYargs()
	{
		let yargs = require( "../node_modules/yargs" );
		yargs.scriptName( "validpoint" )
			.usage( "USAGE: $0 <command> -d [domain1,[domain2,...]] [-f file] [-r] [-q] [-h]" )
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
				describe: "Use a JSON file for input configuration",
				demand: false,
				type: "string",
				conflicts: [ "d" ] // Don't allow users to specify a file or directory for input AND a domain to test
			} )
			.option( "h",
			{
				alias: "help",
				describe: "Show this help screen",
				demand: false
			})
			.option( "r",
			{
				alias: "raw",
				describe: "Include raw test results",
				demand: false
			} )
			.option( "q",
			{
				alias: "quiet",
				describe: "Suppress in-progress output and only show the result",
				demand: false
			} )
			.option( "i",
			{
				alias: "input",
				describe: "Input to send to the test",
				demand: false
			} )
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
			.command( "ssl", "Test website SSL certificate" )
			.help( "help",  "Show this help screen" );

		return yargs;
	}

	static processinputArguments()
	{
		return new Promise(
		( resolve, reject ) =>
		{
			let returnValue =
			{
				command: "",
				domain: ""
			};

			// parse the requested command from the command line arguments, then run the command
			let yargs = CW_Runner.getYargs();
			yargs.argv;

			// Pull a file name from the command line or use the default "validpoint.json"
			let usefile = "";
			if( !yargs.argv.file && !yargs.argv.domain )
			{
				usefile = "validpoint.json";
			}
			else
			{
				usefile = yargs.argv.file;
			}

			if( yargs.argv.input && yargs.argv.input.length > 0 )
			{
				returnValue.input = yargs.argv.input;
			}
			else
			{
				returnValue.input = null;
			}
			
			if( usefile && usefile.length > 0 )
			{
				const CW_InputParser =  require( "./CW_InputParser.js" );
				let parser = new CW_InputParser( usefile, "./" );
				parser.init(
					function() // init callback
					{
						let config = this.parseJsonString();

						if( config.preflight_commands && config.preflight_commands.length > 0 )
						{
							returnValue.command = config.preflight_commands;
						}
						else
						{
							returnValue.preflight_commands = {};
						}

						if( config.commands && config.commands.length > 0 && config.commands[0] != "all" )
						{
							returnValue.command = returnValue.command.concat( config.commands );
						}
						else
						{
							returnValue.command = CW_Constants.DEFAULT_COMMANDS;
						}
						
						returnValue.domain = config.domains;
						returnValue.directory = config.directory;
						returnValue.show_raw = (yargs.argv.raw) ? true : false;
						returnValue.quiet = (yargs.argv.quiet) ? true : false;

						resolve( returnValue );
					});
			}
			else
			{


				// Receiver expects an array for command and domain
				// TODO: add command line input to returnValue.command
				if( yargs.argv._[0] && yargs.argv._[0].length > 0 && yargs.argv._[0] !== "all" )
				{
					returnValue.command = 
					{
						[ yargs.argv._[0] ]: {}
					}
				}
				else if( !yargs.argv.command || yargs.argv.command == "all" )
				{
					returnValue.command = CW_Constants.DEFAULT_COMMANDS;
				}
				else
				{
					returnValue.command = 
					{
						[ yargs.argv.command ]: {}
					}
				}

				returnValue.preflight_commands = [];
				returnValue.domain = [ yargs.argv.domain ];
				returnValue.directory = null;
				returnValue.show_raw = (yargs.argv.raw) ? true : false;
				returnValue.quiet = (yargs.argv.quiet) ? true : false;
				
				resolve( returnValue );
			}
		});
		
	}
}

module.exports = CW_Runner;