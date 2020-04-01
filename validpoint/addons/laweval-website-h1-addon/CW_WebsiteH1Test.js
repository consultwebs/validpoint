/**
 * Validpoint custom add-on module functionality: Fimnd text in a website
 * 
 * @author costmo
 */
let async = require( "./node_modules/async" );
const colors = require( "./node_modules/colors" );

const AdviceContent = require( "./node_modules/validpoint/dist/CW_AdviceContent" );
const Advice = require( "./node_modules/validpoint/dist/CW_Advice" );
const Constants = require( "./node_modules/validpoint/dist/CW_Constants" );

const AdviceContent_WebsiteH1 = require( "./CW_AdviceContent_WebsiteH1" );

const COLOR_THEME =
{
	title: [ "brightGreen", "bold" ],
	header: [ "white", "bold" ],
	text: "white",
	error: "red",
	warn: "yellow",
	ok: "green",
	subject: [ "brightWhite", "bold" ],
	result: "cyan"
}

/**
 * Custom validpoint module to test for the presence of an H1 tag
 * 
 * @author costmo
 */
class CW_WebsiteH1Test
{
	/**
	 * Class constructor.
	 */
	constructor()
	{

	}

	// 
	/**
	 * Entry point for finding a website H1 tag
	 * 
	 * @author costmo
	 * @param {*} input 	Input object from the caller 
	 */
	async findContent( {input = null} )
	{
		try
		{
			AdviceContent.progressContent( { configObject: input,
				input: "Looking for H1 tags from ".header + input.url.subject + "...   ".header 
			});

			let puppeteer = require( "./node_modules/puppeteer" );

			let browser = await puppeteer.launch( 
				{ 
					args: 
					[
						'--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'
					],
					ignoreHTTPSErrors: true 
				} );
			let page = await browser.newPage();
			await page.goto( "https://" + input.url  );

			AdviceContent.progressContent( { configObject: input,
				input: "page loaded.\n".ok + "Waiting for javascript...   ".header
			});

			const watchDog = page.waitFor( 5000 ); // Give the site an additional 5 seconds to do javascript replacements
			await watchDog;

			let outerHtml = await page.evaluate(
				() =>
				{
					let html = document.querySelector( "html" ).outerHTML;

					// There's no HTML node
					if( !html || html.length < 1 )
					{
						return "ERROR";
					}
					else
					{
						return document.querySelector( "h1" ).outerHTML;
					}
				}
			);
			await browser.close();

			// // Make and configure an Advice instance
			let advice = new Advice();
			advice.domain = input.domain;
			
			// // Use an addon AdviceContent child class for processing advice
			let websiteAdviceContent = new AdviceContent_WebsiteH1( { command: "website-h1", testResult: null, configObject: input } );
			// // Show in-progress (user-friendly) advice and get a test result for JSON output
			let adviceResult = websiteAdviceContent.inProgressAdvice( {content: outerHtml, configObject: input} )
			advice.greatest_severity = adviceResult.severity;

			// coerce the result into a returnable Advice object
			advice.item_result = 
			{ ...advice.item_result,
				command: "website-h1",
				category: "addon",
				result: adviceResult.result,
				raw_response: adviceResult.content
			};
			advice.item_result.result_tags.push( adviceResult.result );
			advice.test_result.results.push( advice.item_result );
			advice.finalizeOutput( { stripConfigObject: false, stripItemResult: true } );

			// Remove the config object before output
			delete( advice.configObject );

			return JSON.stringify( advice );
		}
		catch( error )
		{
			console.log( "CATCH ERROR" );
			console.log( error );
			process.stdout.write( "failed\n".error );
			process.stdout.write( "The following error was received when I tried to get your website:\n".error );
			process.stdout.write( error );
			process.stdout.write( "\n\n" );
			return JSON.stringify( "" );
		}
	}


}

module.exports = CW_WebsiteH1Test;