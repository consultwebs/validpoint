/**
 * Convenience class for running commands
 * 
 * @author costmo
 */
const CW_Network = require( "./CW_Network.js" );
const network = new CW_Network();

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
	 * Run a command
	 * 
	 * TODO: refactor sanity checking
	 * @author costmo
	 * @param {*} command 			The command to run
	 * @param {*} configObject		An object holding the ingested configuration values
	 */
	async runCommand( { command = "", configObject = null } )
    {
        // sanity check the requested command
        let validCommands = [ "all", "local", "dns", "http", "https", "http-response", "https-response", "website", "secure-website" ];

        if( validCommands.indexOf( command ) < 0 )
        {
            console.log( `INVALID COMMAND: '${command}'` );
            console.log( "VALID CHOICES:" );
            validCommands.forEach(
                ( value, index ) =>
                {
                    console.log( value );
                });
            process.exit( 1 );
        }

		// TODO: populate the reponse object with values from a helper class instead if individual lines in each 'case'
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
			case "local":
				this.command_localNetwork( { configObject: configObject, responseObject: responseObject } );
				break;
			case "dns":
				this.command_Dns( { configObject: configObject, responseObject: responseObject } );
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
				this.command_WebsiteResponse( { configObject: configObject, responseObject: responseObject, port: 80 } );
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

		CW_Runner.network.checkWebsiteResponse( { domain: configObject.url, port: port } )
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
	 * @param {*} responseObject	A default response object
	 */
	command_Dns( { configObject = null, responseObject =  null } )
	{
		responseObject.test = "local-dns";
		responseObject.description = "Local DNS connectivity check";

		CW_Runner.network.checkDns()
			.then( 
				( result ) => 
				{ 
					responseObject.result = result;
					if( result != "up" )
					{
						responseObject.result_advice = "Your local Domain Name Service (DNS) is not working. Contact your Internet Service Provider and try again.";
					}
					console.log( JSON.stringify( responseObject ) );
				});
	} // command_Dns

	/**
	 * Make sure the local network can reach the outside network by pinging an IP address that's know to never go down.
	 * (Convenience method to decouple logic from the runCommand switch list)
	 * 
	 * @author costmo
	 * @param {*} configObject			A populated config object
	 * @param {*} responseObject	A default response object
	 */
	command_localNetwork( { configObject = null, responseObject =  null } )
	{
		responseObject.test = "local-network";
		responseObject.description = "Local network connectivity check";

		CW_Runner.network.checkLocalNetwork()
			.then( 
				( result ) => 
				{
					responseObject.result = result;
					if( result != "up" )
					{
						responseObject.result_advice = "Your local network is currently offline. Check your Internet connection and try again."
					}
					console.log( JSON.stringify( responseObject ) );
				});
	} // command_localNetwork()

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
				( comlpetion ) =>
				{
					CW_Runner.network.checkWebsiteAvailability( { domain: configObject.domain, port: port } )
							.then(
								( result ) =>
								{
									responseObject.result = result.result;
									responseObject.result_advice = result.result_advice;
									responseObject.response_time = result.response_time;
									responseObject.raw_response = result.raw_response;

									outputObject = responseObject;
									comlpetion( null, responseObject );
								}
							);
				},
				( result, completion ) =>
				{
					CW_Runner.network.checkWebsiteResponse( { domain: configObject.url, port: port } )
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