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
	 * @returns string
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


}

module.exports = CW_Network;