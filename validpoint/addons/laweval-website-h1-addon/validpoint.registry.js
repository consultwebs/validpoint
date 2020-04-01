let CW_WebsiteH1Test = require( "./CW_WebsiteH1Test" );

let test = new CW_WebsiteH1Test();

let registry = 
{
	"website-h1":
	{
		"description": "Verify that a website has at least one h1 tag",
		"handler":  test.findContent
	}
};
module.exports = registry;