
/**
 * A convenience wrapper to abstract some of the code from Promise input parameters
 */

const PING_HOST = "8.8.4.4"; // Google public DNS server
const DNS_HOST = "www.google.com";

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
	}

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
	}

}

module.exports = CW_PromiseResolver;