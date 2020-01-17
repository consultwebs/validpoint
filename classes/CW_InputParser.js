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
                        throw new Error( error.message );
                    }
                    passedThis.mInputString = data;
                    callback.bind( passedThis )();
                });
        }
        catch( exception )
        {
			exception.message = "COULD NOT READ INPUT FILE: " + exception.message;
			throw new Error( exception.message );
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
			exception.message = "COULD NOT PARSE JSON: " + exception.message;
			throw new Error( exception.message );
        }
        
        return returnValue;
	}
	
}

module.exports = CW_InputParser;
