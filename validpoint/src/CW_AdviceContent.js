
/**
 * Parent class for providing advice content. Individual categories should subclass
 * 
 * @author costmo
 */

let CW_Constants = require( "./CW_Constants.js" );
const colors = require( "../node_modules/colors" );
colors.setTheme( CW_Constants.COLOR_THEME );

class CW_AdviceContent
{
	constructor( { category = null, command = null, testResult = null } )
	{
		this.category = category;
		this.command = command;
		this.severity = CW_Constants.SEVERITY_IGNORE;
		this.test_result = testResult;
	}

	/**
	 * Require subclasses to provide an advise() method
	 * 
	 * This mimics an OO abstract method contract
	 * 
	 * @author costmo
	 */
	advise()
	{
		throw new Error( "Improper use of CW_AdviceContent.advise(). Implement this functionality in a subclass." );
	}

	/**
	 * Map a severity level to the result tag
	 * 
	 * This sets the default severity levels for the system. Children should override states that need to return
	 *     something different than the default for a given severity, depending on global and local congifuration
	 * 
	 * @author costmo
	 * @returns int
	 * @param {*} resultTag				The result tag to map 
	 */
	resultTagToSeverity( { resultTag = null } )
	{
		switch( resultTag )
		{
			case "PASS":
				return CW_Constants.SEVERITY_OK;
			case "FAIL":
				return CW_Constants.SEVERITY_NOTICE;
			case "PUNT":
				return CW_Constants.SEVERITY_IGNORE;
			case "UNTESTED":
				return CW_Constants.SEVERITY_IGNORE;
			default:
				return CW_Constants.SEVERITY_IGNORE;
		}
	}

	static progressTitle( {configObject = null, input = null} )
	{
		if( configObject.be_quiet === false || configObject.quiet === false )
		{
			process.stdout.write( input.title + "\n" );
		}
	}

	static progressContent( {configObject = null, input = null} )
	{
		if( configObject.be_quiet === false )
		{
			process.stdout.write( input );
		}
	}

	static progressResult( {configObject = null, input = null} )
	{
		if( configObject.be_quiet === false )
		{
			process.stdout.write( input.ok + "\n" );
		}
	}

	static progressAdvice( {configObject = null, adviceObject = null, testKey = null} )
	{	
		// Don't go further if we aren't going to show output
		if( configObject.be_quiet === false )
		{
			// Create an instance of one of this class' children to get in-progress advice
			let ChildClass = null;
			let child = null;

			if( adviceObject.item_result.category == "website-admin" )
			{
				ChildClass = require( "./CW_AdviceContent_WebsiteAdmin" );
				if( adviceObject.domainResponses )
				{
					child = new ChildClass( { command:  adviceObject.item_result.command, testResult:adviceObject.domainResponses, configObject: configObject } );
				}
				else if( adviceObject.item_result )
				{
					child = new ChildClass( { command:  adviceObject.item_result.command, testResult:adviceObject.item_result, configObject: configObject } );
				}
				
			}
			else if( adviceObject.item_result.category == "website" )
			{
				ChildClass = require( "./CW_AdviceContent_Website" );
				child = new ChildClass( { command:  adviceObject.item_result.command, testResult:adviceObject.item_result, configObject: configObject } );
			}
			else if( adviceObject.item_result.category == "local" )
			{
				ChildClass = require( "./CW_AdviceContent_Local" );
				child = new ChildClass( { command:  adviceObject.item_result.command, testResult:adviceObject.item_result, configObject: configObject } );
			}

			if( child != null )
			{
				child.inProgressAdvice( {testKey: testKey, configObject: configObject, returnType: "screen"} );
			}
		}
	}

	
}
module.exports = CW_AdviceContent;