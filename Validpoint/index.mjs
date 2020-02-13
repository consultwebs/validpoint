require( "strict-mode" )(
() =>
{

});

const CW_Runner = require( "../classes/CW_Runner.js" );
const runner = new CW_Runner();

// And an instance of the parser
const CW_InputParser =  require( "../classes/CW_InputParser.js" );
let config = null;

exports.testDomain = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "domain", callback: callback } );
};

exports.testSecureWebsite = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "secure-website", callback: callback } );
};

exports.testWebsiteContent = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "website-content", callback: callback } );
};

exports.testWebsite = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "website", callback: callback } );
};

exports.testHTTPSResponse = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "https-response", callback: callback } );
};

exports.testHTTPResponse = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "http-response", callback: callback } );
};

exports.testLocalDNS = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "local-dns", callback: callback } );
};

exports.testLocalNetwork = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "local-network", callback: callback } );
};

exports.testHTTPPort = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "http-port", callback: callback } );
};

exports.testHTTPSPort = 
( domain, callback ) =>
{
	commandRunner( { domain: domain, command: "https-port", callback: callback } );
};

exports.jsonConfig = 
() =>
{
	return "jsonConfig";
};



let commandRunner = 
( { domain = null, command = null, callback = null } ) =>
{
	CW_InputParser.makeRunnerObjects( domain ).then(
		( runObjects ) =>
		{
			runObjects.forEach(
				runObject =>
				{
					let parser = new CW_InputParser( runObject.file, "./input/" );

					parser.init(
						async function()
						{
							try
							{
								config = this.parseJsonString();

								if( config == null )
								{
									throw new Error( "COULD NOT READ INPUT CONFIGURATION FILE. EXITING." );
								}

								let CW_Advice = require( "../classes/CW_Advice.js" );
								let advice = new CW_Advice();

								runner.runCommand( { command: command, configObject: config, adviceObject: advice } )
									.then(
										( response ) =>
										{
											callback( null, response );
										}
									);
							}
							catch( error )
							{
								// TODO: Handle exceptions - update to match error handling in bin/ValidPoint
								// The only thing that could happen here is handling config inpt errors. All other errors have been caught and handled before reaching here.

								console.log( "UNCAUGHT ERROR" );
								console.log( error );
							}
						}
					);
				}
			);
		});
};
