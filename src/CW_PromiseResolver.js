let CW_Constants = require( "./CW_Constants" );

const PING_HOSTS = ["8.8.8.8", "1.1.1.1", "1.0.0.1", "139.130.4.5"]; // Google, Cloudflare, Cloudflare, Telstra
const DNS_HOST = "www.google.com";
const MAX_HTTTP_RESPONSE_TIME = 5000; // TODO: Move this to constants

/**
 * A convenience wrapper to abstract code from Promise input parameters
 * 
 * The PromiseResolver handles all rejections and allows callers to to turn rejections into resolvable messages
 * 
 * @author costmo
 * TODO: The PromiseResolver may need to be divided into subclasses for maintainability
 */
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
	resolve_localNetwork( resolve, reject, { pingHosts = null } )
	{
		try
		{

			// Set the default status to "down"
			let ping = require( "../node_modules/ping" );
			let resolved = false;

			if( !pingHosts || !Array.isArray( pingHosts ) || pingHosts.length < 1 )
			{
				pingHosts = PING_HOSTS;
			}

			pingHosts.forEach(
				(pingHost, index) =>
				{
					// Perform a ping to prove the default status
					ping.sys.probe( pingHost,
						( isAlive ) =>
						{
							if( isAlive && !resolved )
							{
								// resolve on first success								
								if( !resolved )
								{
									resolve( CW_Constants.RESULT_PASS );
									resolved = true;
								}
							}

							if( ((index + 1) == pingHosts.length) && !resolved )
							{
								resolve( CW_Constants.RESULT_FAIL );
							}
							// No need to reject() since all failures put us in a resolvable failure state
						}
					);
				}
			);
			
		}
		catch( error)
		{
			console.log( "E" );
			console.log( error );
			let returnError = 
			{	...new Error(),
				raw_response: error,
				message: 	error.message
			};
			throw returnError;
		}
	} // resolve_localNetwork

	/**
	 * Make sure the local Internet connection can resolve a hostname
	 * 
	 * @author costmo
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 */
	resolve_checkLocalDns( resolve, reject, {dnsHost = null} )
	{
		try
		{
			let dns = require( "dns" );
			let msg = CW_Constants.RESULT_FAIL;

			if( !dnsHost || dnsHost.length < 1 )
			{
				dnsHost = DNS_HOST;
			}

			dns.resolve4( dnsHost,
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
		}
		catch( error)
		{
			let returnError = 
			{	...new Error(),
				raw_response: error,
				message: 	error.message
			};
			throw returnError;
		}
	} // resolve_checkDns()

	/**
	 * Check a site's SSL certificate
	 * 
	 * @author costmo
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 * @param {*} url			The URL of the site to check
	 */
	resolve_checkSSL( resolve, reject, { url = null } )
	{
		// TODO: try/catch

		let ssllabs = require( "../node_modules/node-ssllabs" );

		let returnValue = {
			grade: "",
			status: "",
			message: ""
		};

		let options = {
			"host": url,
			"fromCache": true,
			"maxAge": 24,
			"all": "on"
		};

		ssllabs.scan( options,
			( error, host ) =>
			{
				if( error )
				{
					// TODO: Do something. invalid certificates do not trigger this error
				}
				else
				{
					// iterate endpoints
					host.endpoints.forEach(
						endpoint =>
						{
							if( endpoint.grade )
							{
								returnValue.grade = endpoint.grade;
							}
							if( endpoint.statusMessage && endpoint.statusMessage == "Ready" )
							{
								returnValue.status = CW_Constants.RESULT_PASS;
								returnValue.message = endpoint.statusMessage;
							}
							else if( endpoint.statusMessage )
							{
								returnValue.status = CW_Constants.RESULT_FAIL;
								returnValue.message = endpoint.statusMessage;
							}
							else
							{
								returnValue.status = CW_Constants.RESULT_FAIL;
								returnValue.message = "Unknown failure";
							}
						}
					);
					resolve( returnValue );
				}
				
			}
		);
	}

	/**
	 * Check a site's SSL certificate expiration date
	 * 
	 * @author costmo
	 * @param	{*}		resolve		Resolve function	
	 * @param	{*}		reject		Reject function
	 * @param {*} url			The URL of the site to check
	 */
	resolve_checkSSLExpiration( resolve, reject, { url = null } )
	{
		// TODO: try/catch

		let returnValue = {
			daysLeft: "",
			status: "",
			message: ""
		};

		let expiration = require( "../node_modules/check-cert-expiration" );

		expiration( url,
			(error, result) =>
			{
				if( error )
				{
					returnValue.daysLeft = 0;
					returnValue.status = CW_Constants.RESULT_FAIL;
					returnValue.message = error.reason;

					resolve( returnValue );
				}
				else
				{
					returnValue.daysLeft = result.daysLeft;
					returnValue.status = CW_Constants.RESULT_PASS;
					resolve( returnValue );
				}
			}
		);
		
	}

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
		try
		{
			let puppeteer = require( "../node_modules/puppeteer" );

			let browser = await puppeteer.launch( 
				{ 
					args: 
					[
						'--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'
					],
					ignoreHTTPSErrors: true 
				});
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
		catch( error )
		{
			let returnError = 
			{	...new Error(),
				raw_response: error,
				message: 	error.message
			};

			throw returnError;
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
		try
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
		}
		catch( error )
		{
			let returnError = 
			{	...new Error(),
				raw_response: error,
				message: 	error.message
			};

			throw returnError;
		}
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
	resolve_checkWebsiteAvailability( resolve, reject, { domain = null, port = 80 } )
	{
		try
		{
			let tcpPing = require( "../node_modules/tcp-ping" );
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
		}
		catch( error )
		{
			let returnError = 
			{	...new Error(),
				raw_response: error,
				message: 	error.message
			};

			throw returnError;
		}
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
	async resolve_getWhoisInfo( resolve, reject, { domain = null }  )
	{
		try
		{
			const whois = require( "../node_modules/whois-parsed" );

			let result = await whois.lookup( domain );

			if( result.expirationDate )
			{
				resolve( result.expirationDate );
			}
			else
			{
				reject( "NO_WHOIS" );
			}
		}
		catch( error )
		{
			let returnError = 
			{	...new Error(),
				raw_response: error,
				message: 	error.message
			};
			throw returnError;
		}
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
		try
		{
			let dig = require( "../node_modules/node-dig-dns" );
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
						else if( !result.answer || result.answer.length < 1 )
						{
							resolve( [ "" ] );
						}
						else
						{
							resolve( result.answer );
						}
					}
				); // There's no way to get into a .catch from this .then apart from a code/system error
		}
		catch( error)
		{
			let returnError = 
			{	...new Error(),
				raw_response: error,
				message: 	error.message
			};
			throw returnError;
		}
	} // resolve_checkDomain()

	/**
	 * Make objects with data that can be used for a command run
	 * 
	 * @param {Promise.resolve} resolve 	An incoming resolve function
	 * @param {Promise.reject} reject 		An incoming reject function
	 * @param {object} input 				Input parameters for the runner objects
	 * @param {string} input.domain			The domain name for the runner objects
	 * @param {string} input.directory		A directory to look for input/configuration files
	 */
	resolve_makeRunnerObjects( resolve, reject, { domain = null, directory = null } )
	{
		let returnValue = [];

		// Parse `domain` from command line input
		// Request for a specific domain
		if( domain && domain != "all" )
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
							"file": loopDomain.trim() + ".json",
							"directory": directory
						};
						returnValue.push( runObject );
					}
				);
			}
			else // input is a simple string - assumed one domain
			{
				let runObject = {
					"domain": domain.trim(),
					"file": domain.trim() + ".json",
					"directory": directory
				};
				returnValue.push( runObject );
			}
			resolve( returnValue );
		}
		else // request all domains TODO: Update this
		{
			let fs = require( "fs" );
			let path = "./";

			// Iterate all files in the input directory
			fs.readdir( path,
				( error, items ) =>
				{
					items.forEach(
						item =>
						{
							if( item.endsWith( ".json" ) && item !== "validpoint.json" && !item.startsWith( "package" ) )
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