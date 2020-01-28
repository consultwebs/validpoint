
/**
 * A convenience wrapper to abstract code from Promise input parameters
 * 
 * @author costmo
 */

 // TODO: Add an array of hosts to ping, iterate and check them until we find one that responds or there are none left to check
const PING_HOST = "8.8.4.4"; // Google public DNS server
const DNS_HOST = "www.google.com";
const MAX_HTTTP_RESPONSE_TIME = 5000;

class CW_PromiseResolver
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
	 * Ping a server that's known to accept ICMP packets and never go down to make sure the local Internet connection is working.
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 */
	resolve_localNetwork( resolve, reject )
	{
		// Set the default status to "down"
		let ping = require( "ping" );
		let msg = "down";

		// Perform a ping to prove the default status
		ping.sys.probe( PING_HOST,
			async ( isAlive ) =>
			{
				if( isAlive )
				{
					msg = "up";
				}
				
				resolve( msg );
			}
		);
	} // resolve_localNetwork

	/**
	 * Make sure the local Internet connection can resolve a hostname
	 * 
	 * @author costmo
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 */
	resolve_checkDns( resolve, reject )
	{
		let dns = require( "dns" );
		let msg = "down";

		dns.resolve4( DNS_HOST,
			( error, addresses ) =>
			{
				// We don't care about the content of the response, just whether or not there was an error
				if( !error ) // Default is "down" so there's nothing to change for an error response
				{
					msg = "up";
				}
				resolve( msg );
			}
		);
	} // resolve_checkDns()

	/**
	 * Verify that the user's website status and redirect URL
	 * 
	 * @author costmo
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 * @param {*} url			The URL of the site to check
	 * @param {*} port			The port to check (80 or 443)
	 */
	resolve_checkWebsiteResponse( resolve, reject, { url = null, port = 80 } )
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
							response_time: -1,
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
	} // resolve_checkWebsiteResponse()

	/**
	 * Verify that the user's website is responding and get the average connection latency
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 * @param {*} domain		The domain name of the site to check
	 * @param {*} port			The port to check (80 or 443)
	 */
	async resolve_checkWebsiteAvailability( resolve, reject, { domain = null, port = 80 } )
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
	} // resolve_checkWebsiteAvailability()

	/**
	 * Perform a whois query for the given domain. Currently (only) used to check pending domaind expiration.
	 * 
	 * IMPORTANT NOTE: The keys and values that are returned by the query are strings that have no rules from registrar from registrar or OS to OS (the implementation of the local whois executable makes a difference). This parser is likely to fail for some registrars.
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function6
	 * @param {*} domain		The domain name to lookup 
	 */
	resolve_getWhoisInfo( resolve, reject, { domain = null }  )
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
	} // resolve_getWhoisInfo()

	/**
	 * Perform a `dig` query to get domain information
	 * 
	 * @returns Promise
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 * @param {*} domain		The domain/URL to query
	 * @param {*} recordType	The type of record to find ("A", "CNAME", "MX" etc.)
	 * @param {*} queryServer	The server to query. If null, will use the current user's configured DNS server
	 */
	resolve_checkDomain( resolve, reject, { domain = null, recordType = null, queryServer = null } )
	{
		let dig = require( "node-dig-dns" );

		// Doing a query from local dig does not provide every result so we will get the domain's NS 
		//   records first, then we can dig for everything except using an SOA

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
	} // resolve_checkDomain()

	resolve_makeRunnerObjects( resolve, reject, { domain = null } )
	{
		let returnValue = [];

		// Parse `domain` from command line input
		// Request for a specific domain
		if( domain != "all" )
		{
			// input is a comma separated list of domains
			if( domain.indexOf( "," ) >= 0)
			{ 
				const domains = domain.split(',');
				domains.forEach(
					loopDomain =>
					{
						let runObject = {
							"domain": loopDomain.trim(),
							"file": loopDomain.trim() + ".json"
						};
						returnValue.push( runObject );
					}
				);
			}
			else // input is a simple string - assumed one domain
			{
				let runObject = {
					"domain": domain.trim(),
					"file": domain.trim() + ".json"
				};
				returnValue.push( runObject );
			}
			resolve( returnValue );
		}
		else // request all domains
		{
			let fs = require( "fs" );
			let path = "../input/";

			fs.readdir( path,
				( error, items ) =>
				{
					// TODO: Handle errors

					items.forEach(
						item =>
						{
							if( item.endsWith( ".json" ) )
							{
								let runObject = {
									"domain": item.substring( 0, (item.length - 5) ),
									"file": item
								};
								returnValue.push( runObject );
							}
						}
					);
					resolve( returnValue );
				});
		}
	}

}

module.exports = CW_PromiseResolver;