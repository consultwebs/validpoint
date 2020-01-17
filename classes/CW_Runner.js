/**
 * Convenience class for running commands
 * 
 * @author costmo
 */

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
	 * TODO: refactor case statements
	 * TODO: return a JSON string for API-type use
	 * @param {*} command 		The command to run
	 */
	async runCommand( command )
    {
        // sanity check the requested command
        let validCommands = [ "all", "local", "dns", "http", "https" ];

        if( validCommands.indexOf( command ) < 0 )
        {
            console.log( `INVALID COMMAND: '${command}'` );
            console.log( "VALID CHOICES:" );
            validCommands.forEach(
                ( value, index ) =>
                {
                    console.log( value );
                });
            process.exit( 1 ); // TODO: Bubble an exception
        }

        // If we know what to do, do it
		let async = require( "async" );
		const CW_Network = require( "./CW_Network.js" );
		const network = new CW_Network();
		
		switch( command )
		{
			case "local":
				network.checkLocalNetwork()
					.then( 
						( result ) => 
						{ 
							console.log( `LOCAL PING result: ${result}` );
						});
				break;
			case "dns":
				network.checkDns()
					.then( 
						( result ) => 
						{ 
							console.log( `LOCAL DNS result: ${result}` );
						});
				break;
			case "http":
				console.log( "HTTP not yet implemented" );
				break;
			case "https":
				console.log( "HTTPS not yet implemented" );
				break;
			case "all":
				console.log( "ALL not yet implemented" );
				break;
			default:
				// There's actually no way to get here unless the validCommands array is incorrect
				break;
		}

	}
}

module.exports = CW_Runner;