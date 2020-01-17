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
	
	static runCommand( command )
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
		
		switch( command )
		{
			case "local":
				const CW_Network = require( "./CW_Network.js" );
				const network = new CW_Network();

				async.waterfall(
					[
						( callback ) =>
						{
							let response = network.checkLocalNetwork();
							callback( null, response );
						},
						( result, callback ) =>
						{
							let response = network.checkResult( result );
							callback( null, response );
						}
					],
					( error, result ) =>
					{
						console.log( `RESULT: ${result}` );
					}
				);
				break;
			case "dns":
				console.log( "DNS not yet implemented" );
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
