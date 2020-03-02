const CW_StringUtil = require( "../src/CW_StringUtil.js" );

// Run the empty constructor through the test for coverage reporting
test( "Empty constructor",
() =>
{
	let stringObject = new CW_StringUtil();

	expect( typeof stringObject )
		.toBe( "object" );
});

test( "Ending period properly removed",
() =>
{
	let someString = "some.string.";
	let newString = CW_StringUtil.stripTrailingDot( someString );

	expect( newString )
		.toBe( "some.string" );
});

test( "Middle periods left alone",
() =>
{
	let someString = "some.string";
	let newString = CW_StringUtil.stripTrailingDot( someString );

	expect( newString )
		.toBe( someString );
});
		