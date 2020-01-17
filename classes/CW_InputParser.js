/**
 * Parses an input JSON file for configuration
 * 
 * @author costmo
 */

class CW_InputParser
{

    /**
     * Create a new InputParser instance for the given input file
     * 
     * @author costmo
     * @param {*} fileName Name of the file from the 'input' directory
     */
    constructor( fileName )
    {
        this.mFileName = fileName;
        this.mPath = "../input/";
        this.mInputString = "";
    }

    /**
     * Initialize class members and wrap functionality that has to wait for async callbacks
     * 
     * @param {*} callback 		The function to run when init completes
     */
	init( callback )
	{
        let fileSystem = require( "fs" );

        try
        {
            // Make a copy of 'this' that the readFile callback can access
            const passedThis = this;
            fileSystem.readFile( this.mPath + this.mFileName, "utf8", 
                function( error, data )
                {
                    if( error )
                    {
                        throw error;
                    }
                    passedThis.mInputString = data;
                    callback.bind( passedThis )();
                });
        }
        catch( exception )
        {
            console.log( "COULD NOT INITIALIZE THE PARSER: ", exception.stack );
            process.exit( 1 ); // TODO: Needs to bubble an exception
        }
    }

    /**
     * Turn a JSON string into a javascript object so that it's useful
     * 
     * @author costmo
     * @returns javascript object
     */
    parseJsonString()
    {
        let returnValue = null;

        try
        {
            returnValue = JSON.parse( this.mInputString );
        }
        catch( exception )
        {
            console.log( "COULD NOT PARSE JSON: ", exception.stack );
            process.exit( 1 ); // TODO: Needs to bubble an exception
        }
        
        return returnValue;
	}
	
	/**
	 * Run a command
	 * 
	 * TODO: refactor sanity checking
	 * TODO: refactor case statements
	 * TODO: return a JSON string for API-type use
	 * @param {*} command 
	 */
	static async runCommand( command )
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

module.exports = CW_InputParser;
