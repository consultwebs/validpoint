/**
 * Provides network functionalty
 * 
 * @author costmo
 */

 /*
 // TODO: Refactor complicated function definitions that are used as input parameters.
 Having really complicated code (a fully-formed function) as an input parameter to a function/method call creates code that becomes incresingly more difficult to test and maintain.
 I know that's the Java/javascript way, but it doesn't have to be. For example, this:
 return new Promise( (resolve, reject) => { <80 lines of code go here> } ); // The way Java has taught us to write code, but other OO languages not care for
 Should be more like this:
 return this.promiseResolver( this.someOtherFunction( input ) ); // Move meaningful code to someOtherFunction() - promiseResolver returns Promise
 */

 // TODO: Add an array of hosts to ping, iterate and check them until we find one that responds or there are none left to check
const PING_HOST = "8.8.4.4"; // Google public DNS server
const DNS_HOST = "www.google.com";
const MAX_HTTTP_RESPONSE_TIME = 5000;

class CW_Network
{
	
    /**
     * Create a new instance
     * 
     * @author costmo
     */
    constructor()
    {
	}

	// Promise resolver for the local network test
	// resolve_localNetwork( resolve, reject )
	// {
	// 	// Set the default status to "down"
	// 	let ping = require( "ping" );
	// 	let msg = "down";

	// 	// Perform a ping to prove the default status
	// 	ping.sys.probe( PING_HOST,
	// 		async ( isAlive ) =>
	// 		{
	// 			if( isAlive )
	// 			{
	// 				msg = "up";
	// 			}
	// 			resolve( msg );
	// 		}
	// 	);
	// }

	/**
	 * Ping a server that's known to accept ICMP packets and never go down to make sure the local Internet connection is working.
	 * 
	 * @author costmo
	 * @returns Promise
	 */
    async checkLocalNetwork()
    {
		let CW_PromiseResolver = require( "./CW_PromiseResolver" );
		let resolver = new CW_PromiseResolver();
	
		return new Promise(
			(resolve, reject ) =>
			{
				resolver.resolve_localNetwork( resolve, reject );
			}
		);	
	} // checkLocalNetwork()
	
	/**
	 * Make sure the local Internet connection can resolve a hostname
	 * 
	 * @author costmo
	 * @returns Promise
	 */
	async checkDns()
	{
		let CW_PromiseResolver = require( "./CW_PromiseResolver" );
		let resolver = new CW_PromiseResolver();

		return new Promise(
			( resolve, reject ) =>
			{
				resolver.resolve_checkDns( resolve, reject );
			}
		);
	} // checkDns()

	/**
	 * Verify that the user's website status and redirect URL
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param {*} url			The URL of the site to check
	 * @param {*} port			The port to check (80 or 443)
	 */
	async checkWebsiteResponse( { url = null, port = 80 } )
	{
		return new Promise(
			( resolve, reject ) =>
			{
				let returnValue;
				let protocol= require( "http" );
				if( port == 443 )
				{
					protocol = require( "https" );
				}

				let options = 
				{
					hostname: url,
					port: port,
					path: "/",
					method: "GET"
				};

				const request = protocol.request( options,
					( response ) =>
					{
						// If you don't have an on.data - even if you're not doing anything with the data - node never fires on.end
						response.on( "data", ( data ) => {} );

						response.on( "end",
							() =>
							{
								// Pull out the headers
								let headers = response.headers;

								returnValue = 
								{
									result: "up",
									result_advice: "",
									response_time: 0,
									raw_response: response,
									status_code: response.statusCode,
									redirect_location: (undefined == headers.location) ? "" : headers.location
								};

								// 400-level errors
								if( response.statusCode.toString().startsWith( "4" ) )
								{
									returnValue.result = "down";
									returnValue.result_advice = "The home page of your website is not currently available. Contact your website hosting provider immediately.";
								}
								else if( response.statusCode.toString().startsWith( "5" ) ) // 500-level errors
								{
									returnValue.result = "down";
									returnValue.result_advice = "Your website is experiencing a technical issue that is preventing people from using it. Contact your website hosting provider immediately.";
								}
								else if( response.statusCode.toString().startsWith( "3" ) ) // Redirects
								{
									returnValue.result = "redirect";
									returnValue.result_advice = "Your website is redirecting. This is not necessarily a problem, but it may cause an SEO penalty. Please contact your SEO specialist.";
								}
								else if( response.statusCode != 200 ) // Everything else that's not '200'
								{
									returnValue.result = "down";
									returnValue.result_advice = "Your website is not available to users for an unusual technical reason. Contact your website hosting provider.";
								}
								
								resolve( returnValue );
							}
						);
					}
				);

				request.end();

				request.on( "error",
					( error ) =>
					{
						// TODO: Reject, don't resolve
						console.log( error );
						resolve( returnValue );
					}
				);
			});
	} // checkWebsiteResponse()

	/**
	 * Verify that the user's website is responding and get the average connection latency
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param {*} domain		The domain name of the site to check
	 * @param {*} port			The port to check (80 or 443)
	 */
	async checkWebsiteAvailability( { domain = null, port = 80 } )
	{
		return new Promise(
			( resolve, reject ) =>
			{
				let tcpPing = require( "tcp-ping" );
				let returnValue;

				// Ping configuration parameters
				let tcpConfig = 
				{
					address: domain,
					port: port,
					attempts: 3
				}

				tcpPing.ping( tcpConfig,
					( error, response ) =>
					{
						if( !error ) // Default is "down" so there's nothing to change for an error response
						{
							// We're sending back more than a simple string. Construct the return object
							returnValue = 
							{
								result: "",
								result_advice: "",
								response_time: 0,
								raw_response: ""
							};

							// Failed ping results in valid result with "NaN" for the timing values
							if( parseFloat( response.avg ) + "" !== "NaN" ) // Node has no isNan()?
							{
								// Site is up
								returnValue.result = "up";
								returnValue.response_time = response.avg;
								returnValue.raw_response = response;

								if( response.avg > MAX_HTTTP_RESPONSE_TIME )
								{
									returnValue.result_advice = "Your website is taking much longer than it should to respond, and it may be entirely down. Contact your hosting provider for immediate assistance.";
								}
							}
							else
							{
								// Site is down
								returnValue = 
								{
									result: "down",
									response_time: 0,
									raw_response: response
								}
							}

							resolve( returnValue );
						}

						// Return "Down" if there's an error
						returnValue = 
						{
							result: "down",
							response_time: 0,
							raw_response: response
						}
						resolve( returnValue );
					}
				);
			}
		);
	} // checkWebsiteAvailability()

	/**
	 * Perform a whois query for the given domain. Currently (only) used to check pending domaind expiration.
	 * 
	 * IMPORTANT NOTE: The keys and values that are returned by the query are strings that have no rules from registrar from registrar or OS to OS (the implementation of the local whois executable makes a difference). This parser is likely to fail for some registrars.
	 * 
	 * TODO: Update this so a caller can tell the parser which bit of data it wants returned.
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param {*} domain		The domain name to lookup 
	 */
	async getWhoisInfo( { domain = null } )
	{
		return new Promise(
			( resolve, reject ) =>
			{
				const whois = require( "whois" );
				const whoisParser = require( "parser-whoisv2" );

				whois.lookup(
					domain,
					( error, response ) =>
					{

						let lineItems = whoisParser.parseWhoIsData( response )
						lineItems.forEach(
								item => 
								{
									let lowerCaseAttribute = item.attribute.toLowerCase();
									if( lowerCaseAttribute.includes( "expiration" ) )
									{
										resolve( item.value );
									}
								}
							);


						// TODO: Handle errors
					}
				);
			}
		);
	}

	/**
	 * Perform a `dig` query to get domain information
	 * 
	 * @returns Promise
	 * @param {*} domain		The domain/URL to query
	 * @param {*} recordType	The type of record to find ("A", "CNAME", "MX" etc.)
	 * @param {*} queryServer	The server to query. If null, will use the current user's configured DNS server
	 */
	async checkDomain( { domain = null, recordType = null, queryServer = null } )
	{
		return new Promise(
			( resolve, reject ) =>
			{
				let dig = require( "node-dig-dns" );

				// Doing a query from local dig does not provide every result for "ANY"
				//    so we will get the domain's NS records first, then we can dig for everything except a CNAME list using
				//    `dig @authority_server domain ANY`

				if( queryServer == null )
				{
					dig( [ domain, recordType ] )
						.then(
							( result ) =>
							{
								resolve( result.answer );
							}
						);
				}
				else
				{
					dig( [ queryServer, domain, recordType ] )
						.then(
							( result ) =>
							{
								resolve( result.answer );
							}
						);
				}
			}
		);
	}


}

module.exports = CW_Network;