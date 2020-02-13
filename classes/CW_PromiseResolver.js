
/**
 * A convenience wrapper to abstract code from Promise input parameters
 * 
 * The PromiseResolver handles all rejections and allows callers to to turn rejections into resolvable messages
 * 
 * @author costmo
 * TODO: The PromiseResolver will need to be divided into subclasses for maintainability
 */

let CW_Constants = require( "./CW_Constants.js" );

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
		let msg = CW_Constants.RESULT_FAIL;

		// Perform a ping to prove the default status
		ping.sys.probe( PING_HOST,
			async ( isAlive ) =>
			{
				if( isAlive )
				{
					msg = CW_Constants.RESULT_PASS;
				}
				
				resolve( msg );
				// No need to reject() since all errors put us in a resolvable failure state
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
	resolve_checkLocalDns( resolve, reject )
	{
		let dns = require( "dns" );
		let msg = CW_Constants.RESULT_FAIL;

		dns.resolve4( DNS_HOST,
			( error, addresses ) =>
			{
				// If there was no error, it's a pass
				if( !error ) // Default is "down" so there's nothing to change for an error response
				{
					msg = CW_Constants.RESULT_PASS;
				}
				resolve( msg );
				// No need to reject() since all errors put us in a resolvable failure state
			}
		);
	} // resolve_checkDns()

	/**
	 * Verify that essential HTML tags exist on the user's site
	 * 
	 * @author costmo
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 * @param {*} url			The URL of the site to check
	 */
	async resolve_checkWebsiteContent( resolve, reject, { url = null } )
	{
		let puppeteer = require( "puppeteer" );

		let browser = await puppeteer.launch( { ignoreHTTPSErrors: true } );
		let page = await browser.newPage();
		await page.goto( "https://" + url );

		let outerHtml = await page.evaluate(
			() =>
			{
				let html = document.querySelector( "html" ).outerHTML;

				// There's no HTML node
				if( !html || html.length < 1 )
				{
					return "ERROR";
				}
				
				return document.querySelector( "html" ).outerHTML;
			}
		);
			
		await browser.close();
		
		if( !outerHtml || outerHtml == "ERROR" )
		{
			reject( "NO_HTML" );
		}
		else
		{
			resolve( outerHtml );
		}
	}

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
							result: CW_Constants.RESULT_PASS,
							response_time: -1,
							raw_response: response.statusCode, // send the status code as the raw response
							redirect_location: (undefined == headers.location) ? "" : headers.location
						};

						// 400-level errors
						if( response.statusCode.toString().startsWith( "4" ) )
						{
							returnValue.result = CW_Constants.RESULT_FAIL;
						}
						else if( response.statusCode.toString().startsWith( "5" ) ) // 500-level errors
						{
							returnValue.result =  CW_Constants.RESULT_FAIL;
						}
						else if( response.statusCode.toString().startsWith( "3" ) ) // Redirects
						{
							// for redirects, report the redirect location as the raw response
							returnValue.raw_response = returnValue.redirect_location;
							returnValue.result = CW_Constants.RESULT_PUNT;
						}
						else if( response.statusCode != 200 ) // Everything else that's not '200'
						{
							returnValue.result =  CW_Constants.RESULT_FAIL;
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
				returnValue = 
				{
					result: CW_Constants.RESULT_FAIL,
					response_time: -1,
					raw_response: ""
				};

				if( error.code == "ENOTFOUND" )
				{
					returnValue.raw_response = "NOT_FOUND";
				}
				else if( error.code == "ETIMEDOUT" )
				{
					returnValue.raw_response = "TIMED_OUT";
				}
				else if( error.reason ) // If there's a failure reason that isn't contained in a predictable tag
				{
					returnValue.raw_response = error.reason;
				}

				// Reject calls for "website" command when domain and/or port are bad or an http(s) request completely fails (e.g. certificate handshake failure)
				reject( returnValue );
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
						result:CW_Constants.RESULT_PASS,
						response_time: -1,
						raw_response: ""
					};

					// Failed ping results in valid result with "NaN" for the timing values
					if( parseFloat( response.avg ) + "" !== "NaN" ) // Node has no isNan()?
					{
						// Site is up
						returnValue.result = CW_Constants.RESULT_PASS;
						returnValue.response_time = response.avg;
						returnValue.raw_response = response;

						if( response.avg > MAX_HTTTP_RESPONSE_TIME ) // Request took too long. Punt to see if a response is needed
						{
							returnValue.result = CW_Constants.RESULT_PUNT;
						}
					}
					else // There was no response from the website
					{
						returnValue = 
						{
							result: CW_Constants.RESULT_FAIL,
							response_time: 0,
							raw_response: "NO_RESPONSE"
						}
					}
					
					resolve( returnValue );
				}
				else // Not sure this can be triggered since providing bad URLs and ports results in resolvable errors above
				{
					returnValue = 
					{
						result:CW_Constants.RESULT_FAIL,
						response_time: -1,
						raw_response: "NO_RESPONSE"
					};

					reject( returnValue );
				}
				// I am unreachable
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
							else if( lowerCaseAttribute.includes( "error:" ) )
							{
								reject( "NO_WHOIS" );
							}
						}
					);
			}
		); // There's no way to get into a .catch from this .then apart from a code/system error
	} // resolve_getWhoisInfo()

	/**
	 * Perform a `dig` query to get domain information
	 * 
	 * @returns Promise
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 * @param {*} domain		The domain/URL to query
	 * @param {*} recordType	The type of record to find ("A", "CNAME", "MX" etc.)
	 * @param {*} queryServer	The server to query. If null, will use the current user's configured DNS server. This feature was obsoleted because servers don't always answer properly for remote requests.
	 */
	resolve_checkDomain( resolve, reject, { domain = null, recordType = null, queryServer = null } )
	{
		let dig = require( "node-dig-dns" );
		dig( [ domain, recordType ] )
			.then(
				( result ) =>
				{
					// Require CNAME and A records. Failure to find one of those means the whois server couldn't find the domain or failed to respond
					if( (recordType == "NS" || recordType == "A") && 
						(!result.answer || result.answer.length < 1)  )
					{
						reject( "NO_ANSWER" );
					}
					else
					{
						resolve( result.answer );
					}
				}
			); // There's no way to get into a .catch from this .then apart from a code/system error
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

			// Iterate all files in the input directory
			fs.readdir( path,
				( error, items ) =>
				{
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