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
	
}

module.exports = CW_InputParser;
