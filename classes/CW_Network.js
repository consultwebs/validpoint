/**
 * Provides network functionalty
 * 
 * @author costmo
 */

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
	 * Using a Google public DNS server
	 * 
	 * @author costmo
	 * @returns string
	 */
    checkLocalNetwork()
    {
			// TODO: Figure out why my system is throwing "Cannot find module 'ping'" even though it's clearly installed"
			// let ping = require( "ping" );

			console.log( "PINGING" );

			let msg = "down";

			// ping.sys.probe( "8.8.4.4",
			// 	( isAlive ) =>
			// 	{
			// 		console.log( "CHECKING" );
			// 		if( isAlive )
			// 		{
			// 			console.log( "IS ALIVE" );
			// 			msg = "up";
			// 		}
			// 		return msg;
			// 	}
			// );

			return msg;
    }

	// This will be removed once "ping" is working locally
    checkResult( input )
    {
		return input;
    }


}

module.exports = CW_Network;