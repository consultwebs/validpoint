/**
 * Custom add-ons register here
 */

let indexFile = require( "../../../laweval-custom-text-addon/index.mjs" );

let registry = 
{
	"website-custom-text":
	{
		"input": [ "url", "find" ],
		"description": "Verify that your website contains a specific string",
		"handler": indexFile
	}
};
module.exports = registry;
