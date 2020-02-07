require( "strict-mode" )(
() =>
{

});

const CW_Runner = require( "../classes/CW_Runner.js" );
const runner = new CW_Runner();

// And an instance of the parser
const CW_InputParser =  require( "../classes/CW_InputParser.js" );
let config = null;

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
							catch( exception )
							{
								// TODO: Handle exceptions
								// console.log( exception );
							}
						}
					);
				}
			);
		});
};
