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

		// TODO: populate the reponse object with values from a helper class instead if individual lines in each 'case'
		let responseObject = 
		{
			test: "",
			description: "",
			result: "",
			result_advice: ""
		};
		
		switch( command )
		{
			case "local":
				responseObject.test = "local-network";
				responseObject.description = "Local network connectivity check";

				network.checkLocalNetwork()
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
				break;
			case "dns":
				responseObject.test = "local-dns";
				responseObject.description = "Local DNS connectivity check";

				network.checkDns()
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