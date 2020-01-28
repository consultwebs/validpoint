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

	/**
	 * Parse the domain name or domain list from command line input
	 * 
	 * // TPDO: Needs to resolve a promise for filesystem access
	 * 
	 * @author costmo
	 * @returns Array
	 * @param {*} domain 			The domain, comma-separated list of domains, or "all".
	 */
	static makeRunnerObjects( domain )
	{
		let returnValue = [];

		// Parse `domain` from command line input
		// Request for a specific domain
		if( domain != "all" )
		{
			// input is a comma separated list of domains
			if( domain.indexOf( "," ) >= 0)
			{ 
				const domains = domain.split(',');
				domains.forEach(
					loopDomain =>
					{
						let runObject = {
							"domain": loopDomain.trim(),
							"file": loopDomain.trim() + ".json"
						};
						returnValue.push( runObject );
					}
				);
			}
			else // input is a simple string - assumed one domain
			{
				let runObject = {
					"domain": domain.trim(),
					"file": domain.trim() + ".json"
				};
				returnValue.push( runObject );
			}
			return returnValue;
		}
		else // request all domains
		{
			// TODO: needs to be called async

			// let fs = require( "fs" );
			// let path = "../input/";

			// fs.readdir( path,
			// 	( error, items ) =>
			// 	{
			// 		// TODO: Handle errors

			// 		items.forEach(
			// 			item =>
			// 			{
			// 				if( item.endsWith( ".json" ) )
			// 				{
			// 					let runObject = {
			// 						"domain": item.substring( 0, (item.length - 5) ),
			// 						"file": item
			// 					};
			// 					returnValue.push( runObject );
			// 				}
			// 			}
			// 		);
			// 		return returnValue;
			// 	});
		}
	}
	
}

module.exports = CW_InputParser;
