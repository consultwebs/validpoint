
/**
 * Parent class for providing advice content. Individual categories should subclass
 * 
 * @author costmo
 */

let CW_Constants = require( "./CW_Constants.js" );

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

	
}
module.exports = CW_AdviceContent;