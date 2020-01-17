/**
 * Provides network functionalty
 * 
 * @author costmo
 */

const PING_HOST = "8.8.4.4"; // Google public DNS server
const DNS_HOST = "www.google.com";

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

	/**
	 * Ping a server that's known to accept ICMP packets and never go down to make sure the local Internet connection is working.
	 * 
	 * @author costmo
	 * @returns Promise
	 */
    async checkLocalNetwork()
    {
		return new Promise(
			(resolve, reject ) =>
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
			}
		);	
	}
	
	/**
	 * Make sure the local Internet connection can resolve a hostname
	 * 
	 * @author costmo
	 * @returns Promise
	 */
	async checkDns()
	{
		return new Promise(
			( resolve, reject ) =>
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
			}
		);
	}

	/**
	 * Verify that the user's website is responding and get the average connection latency
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param {*} domain		The domain name of the site to check
	 * @param {*} port			The port to check (80 or 443)
	 */
	async checkWebsiteAvailability( domain, port )
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
	}


}

module.exports = CW_Network;