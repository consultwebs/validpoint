const CW_InputParser = require( "../dist/CW_Network" );
const CW_Runner = require( "../dist/CW_Runner" );
const CW_PromiseResolver = require( "../dist/CW_PromiseResolver" );

it( "Tests local network connectivity",
async () =>
{
	let resolver = new CW_PromiseResolver();
	
	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_localNetwork( resolve, reject );
		}
	);
	expect( thePromise ).toBe( "PASS" );
});

it( "Tests local DNS availability",
async () =>
{
	let resolver = new CW_PromiseResolver();
	
	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_checkLocalDns( resolve, reject );
		}
	);
	expect( thePromise ).toBe( "PASS" );
});

// it( "Tests website content",
// async () =>
// {
// 	let resolver = new CW_PromiseResolver();
	
// 	let thePromise = await new Promise(
// 		(resolve, reject ) =>
// 		{
// 			resolver.resolve_checkWebsiteContent( resolve, reject, {url: "consultwebs.com"} );
// 		}
// 	);
// 	expect( thePromise ).toBe( "PASS" );
// });

it( "Tests website response",
async () =>
{
	let resolver = new CW_PromiseResolver();
	
	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_checkWebsiteResponse( resolve, reject, {url: "www.consultwebs.com", port: 80} );
		}
	);

	expect( thePromise ).toEqual( 
		expect.objectContaining( 
			{
				raw_response: expect.anything()
			}) 
	);

	expect( thePromise ).toEqual( 
		expect.objectContaining( 
			{
				result: expect.stringMatching( "PUNT" )
			}) 
	);

	thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_checkWebsiteResponse( resolve, reject, {url: "www.consultwebs.com", port: 443} );
		}
	);

	expect( thePromise ).toEqual( 
		expect.objectContaining( 
			{
				raw_response: expect.anything()
			}) 
	);

	expect( thePromise ).toEqual( 
		expect.objectContaining( 
			{
				result: expect.stringMatching( "PASS" )
			}) 
	);
});