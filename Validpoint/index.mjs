require( "strict-mode" )(
() =>
{

});

const CW_Runner = require( "../classes/CW_Runner.js" );
const runner = new CW_Runner();

// And an instance of the parser
const CW_InputParser =  require( "../classes/CW_InputParser.js" );
let config = null;



exports.jsonConfig = 
() =>
{
	return "jsonConfig";
};

exports.testHTTPPort = 
( domain, callback ) =>
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

								runner.runCommand( { command: "http-port", configObject: config, adviceObject: advice } )
									.then(
										( response ) =>
										{
											console.log( "RUNNER GOT RESPONSE" )
											console.log( response );
											callback( null, response );
											
										}
									);
							}
							catch( exception )
							{
								// console.log( exception );
							}
						}
					);
				}
			);
			
			// console.log( runObjects );
		});

	// runCommand( { command: "http-port", domain: domain } )
	// 	.then(
	// 		(error, result) =>
	// 		{
	// 			console.log( "THEN" );
	// 			console.log( error );
	// 			console.log( result );
	// 			console.log( "---------" );

	// 			return callback( null, "SUCCESS: " + result );
	// 		}
	// 	);

	// if( domain == "appideas.com" )
	// {
	// 	return callback( "ERROR: "  + result);
	// }
	// else
	// {
	// 	return callback( null, "SUCCESS: " + result );
	// }
};

// let runCommand = 
// async ( { command = null, domain = null } ) =>
// {
// 	console.log( "a" );

	
// 	console.log( "b" );

// 	CW_InputParser.makeRunnerObjects( domain ).then(
// 		( runObjects ) =>
// 		{
// 			console.log( "d" );
// 			if( runObjects && runObjects.length > 0 )
// 			{
// 				console.log( "e" );
// 				// The things that run in the forEach are synchronous, so checks for all domains run at once and return in no particular order
// 				runObjects.forEach(
// 					runObject =>
// 					{
// 						console.log( "f" );
// 						let parser = new CW_InputParser( runObject.file );

// 						parser.init(
// 							function() // init callback
// 							{
// 								console.log( "g" );
// 								try
// 								{
// 									console.log( "h" );
// 									// `this` is an instance of the InputParser
// 									config = this.parseJsonString();
				
// 									if( config == null )
// 									{
// 										throw new Error( "COULD NOT READ INPUT CONFIGURATION FILE. EXITING." );
// 									}
// 									console.log( "i" );

// 									let CW_Advice = require( "../classes/CW_Advice.js" );
// 									let advice = new CW_Advice();
// 									console.log( "j" );
// 									runner.runCommand( { command: cmd, configObject: config, adviceObject: advice } );
// 									console.log( "k" );
// 								}
// 								catch( exception )
// 								{
// 									console.log( "Process exception:" );
// 									console.log( exception );
// 									process.exit( 1 );
// 								}
// 							}
// 						);
// 					}
// 				);
// 			}
// 			else // We didn't get any JSON files for input
// 			{
// 				throw new Error( "COULD NOT FIND ANY CONFIGURATION FILES TO RUN." );
// 			}
// 		}
// 	);
// };

	// parser.init(
	// 	async function() // init callback
	// 	{
	// 		console.log( "d" );
	// 		try
	// 		{
	// 			// `this` is an instance of the InputParser
	// 			config = this.parseJsonString();
	// 			console.log( "e" );

	// 			if( config == null )
	// 			{
	// 				throw new Error( "COULD NOT READ INPUT CONFIGURATION FILE. EXITING." );
	// 			}
	// 			console.log( "1" );

	// 			let CW_Advice = require( "../classes/CW_Advice.js" );
	// 			let advice = new CW_Advice();
	// 			return await new Promise(
	// 				( resolve, reject ) =>
	// 				{
	// 					console.log( "2" );
	// 					resolve( null, runner.runCommand( { command: command, configObject: config, adviceObject: advice } ) );
	// 				}
	// 			);
	// 		}
	// 		catch( exception )
	// 		{
	// 			console.log( "Process exception:" );
	// 			console.log( exception );
	// 			process.exit( 1 );
	// 		}
	// 	}
	// );
// };



/**
 * from LawEval root directory:
 * cd ../
 * mkdir testapp
 * cd testapp
 * npm init -y
 * npm install --save ../LawEval/Validpoint
 */
