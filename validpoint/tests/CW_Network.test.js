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
});

it( "Tests secure website response",
async () =>
{
	let resolver = new CW_PromiseResolver();

	let thePromise = await new Promise(
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

it( "Tests website availability",
async () =>
{
	let resolver = new CW_PromiseResolver();

	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_checkWebsiteAvailability( resolve, reject, {domain: "consultwebs.com", port: 80} );
		}
	);

	expect( thePromise ).toEqual( 
		expect.objectContaining( 
			{
				result: expect.stringMatching( "PASS" ),
				raw_response: expect.objectContaining(
					{
						address: expect.stringMatching( "consultwebs.com" )
					}
				)
			}) 
	);
});

it( "Tests secure website availability",
async () =>
{
	let resolver = new CW_PromiseResolver();

	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_checkWebsiteAvailability( resolve, reject, {domain: "consultwebs.com", port: 443} );
		}
	);

	expect( thePromise ).toEqual( 
		expect.objectContaining( 
			{
				result: expect.stringMatching( "PASS" ),
				raw_response: expect.objectContaining(
					{
						address: expect.stringMatching( "consultwebs.com" )
					}
				)
			}) 
	);
});

it( "Tests whois response",
async () =>
{
	let resolver = new CW_PromiseResolver();

	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_getWhoisInfo( resolve, reject, {domain: "consultwebs.com"} );
		}
	);

	expect( thePromise.length ).toBeGreaterThan( 0 );
});

it( "Tests A record response",
async () =>
{
	let resolver = new CW_PromiseResolver();

	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_checkDomain( resolve, reject, {domain: "consultwebs.com", recordType: "A", queryServer: null} );
		}
	);

	expect( thePromise.length ).toBeGreaterThan( 0 );

	expect( thePromise[0] ).toEqual(
			expect.objectContaining(
				{
					domain: expect.stringMatching( "consultwebs.com" )
				}
			)
	);

	expect( thePromise[0] ).toEqual(
		expect.objectContaining(
			{
				type: expect.stringMatching( "A" )
			}
		)
	);
});

it( "Tests NS record response",
async () =>
{
	let resolver = new CW_PromiseResolver();

	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_checkDomain( resolve, reject, {domain: "consultwebs.com", recordType: "NS", queryServer: null} );
		}
	);

	expect( thePromise.length ).toBeGreaterThan( 1 );

	expect( thePromise[0] ).toEqual(
			expect.objectContaining(
				{
					domain: expect.stringMatching( "consultwebs.com" )
				}
			)
	);

	expect( thePromise[1] ).toEqual(
		expect.objectContaining(
			{
				domain: expect.stringMatching( "consultwebs.com" )
			}
		)
);

	expect( thePromise[0] ).toEqual(
		expect.objectContaining(
			{
				type: expect.stringMatching( "NS" )
			}
		)
	);

	expect( thePromise[1] ).toEqual(
		expect.objectContaining(
			{
				type: expect.stringMatching( "NS" )
			}
		)
	);
});

it( "Tests SSL certificate response",
async () =>
{
	let resolver = new CW_PromiseResolver();

	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_checkSSL( resolve, reject, {url: "www.consultwebs.com"} );
		}
	);

	expect( thePromise ).toEqual(
		expect.objectContaining(
			{
				grade: expect.anything(),
				status: expect.stringMatching( "PASS" )
			}
		)
	);

}, 7000);

it( "Tests SSL certificate expiration response",
async () =>
{
	let resolver = new CW_PromiseResolver();

	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_checkSSLExpiration( resolve, reject, {url: "www.consultwebs.com"} );
		}
	);

	expect( thePromise ).toEqual(
		expect.objectContaining(
			{
				daysLeft: expect.any( Number ),
				status: expect.stringMatching( "PASS" )
			}
		)
	);

	expect( thePromise.daysLeft ).toBeGreaterThan( 0 );
}, 7000);

it( "Tests making runner objects",
async () =>
{
	let resolver = new CW_PromiseResolver();

	let thePromise = await new Promise(
		(resolve, reject ) =>
		{
			resolver.resolve_makeRunnerObjects( resolve, reject, {domain: "www.consultwebs.com", directory: null} );
		}
	);

	expect( thePromise.length ).toBeGreaterThan( 0 );

	expect( thePromise[0] ).toEqual(
			expect.objectContaining(
				{
					domain: expect.stringMatching( "consultwebs.com" ),
					file: expect.anything()
				}
			)
	);
});

// it( "Tests website content",
// async () =>
// {
// 	let resolver = new CW_PromiseResolver();

// 	let thePromise = await new Promise(
// 		(resolve, reject ) =>
// 		{
// 			resolver.resolve_checkWebsiteContent( resolve, reject, {url: "www.consultwebs.com"} );
// 		}
// 	);
// }, 5000);
