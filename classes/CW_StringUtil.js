/**
 * Helper functions for common string manipulation
 * @author costmo
 */
class CW_StringUtil
{
	/**
	 * Class constructor for academic completeness. Class methods should be static, so an instance of 
	 *    the class shouldn't be a meaningful thing to have.
	 */
	constructor()
	{
	}

	static stripTrailingDot( input )
	{
		if( input[ (input.length - 1) ] === "." )
		{
			input = input.slice( 0, -1 );
		}
		return input;
	}
}

module.exports = CW_StringUtil;
