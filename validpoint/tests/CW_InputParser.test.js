const CW_InputParser = require( "../src/CW_InputParser.js" );

test( "InputParser is an object",
() =>
{
	let parser = new CW_InputParser( "", "./" );

	expect( typeof parser )
		.toBe( "object" );
});

test( "Null path resolves",
() =>
{
	let parser = new CW_InputParser( "", null );

	expect( typeof parser )
		.toBe( "object" );

	expect( parser.mPath )
		.toBe( "./" );
});
		