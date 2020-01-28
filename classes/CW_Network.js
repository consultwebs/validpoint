/**
 * Provides network functionalty
 * 
 * @author costmo
 */
class CW_Network
{
	
    /**
     * Create a new instance
     * 
     * @author costmo
     */
    constructor()
    {
	}

	/**
	 * Ping a server that's known to accept ICMP packets and never go down to make sure the local Internet connection is working.
	 * 
	 * @author costmo
	 * @returns Promise
	 */
    async checkLocalNetwork()
    {
		let CW_PromiseResolver = require( "./CW_PromiseResolver" );
		let resolver = new CW_PromiseResolver();
	
		return new Promise(
			(resolve, reject ) =>
			{
				resolver.resolve_localNetwork( resolve, reject );
			}
		);	
	} // checkLocalNetwork()
	
	/**
	 * Make sure the local Internet connection can resolve a hostname
	 * 
	 * @author costmo
	 * @returns Promise
	 */
	async checkDns()
	{
		let CW_PromiseResolver = require( "./CW_PromiseResolver" );
		let resolver = new CW_PromiseResolver();

		return new Promise( 
			(resolve, reject ) => 
			{
				resolver.resolve_checkDns( resolve, reject );
			});
	} // checkDns()

	/**
	 * Verify that the user's website status and redirect URL
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param {*} url			The URL of the site to check
	 * @param {*} port			The port to check (80 or 443)
	 */
	async checkWebsiteResponse( { url = null, port = 80 } )
	{
		let CW_PromiseResolver = require( "./CW_PromiseResolver" );
		let resolver = new CW_PromiseResolver();

		return new Promise( 
			( resolve, reject ) => 
			{
				resolver.resolve_checkWebsiteResponse( resolve, reject, { url: url, port: port } );
			});
	} // checkWebsiteResponse()

	/**
	 * Verify that the user's website is responding and get the average connection latency
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param {*} domain		The domain name of the site to check
	 * @param {*} port			The port to check (80 or 443)
	 */
	async checkWebsiteAvailability( { domain = null, port = 80 } )
	{
		let CW_PromiseResolver = require( "./CW_PromiseResolver" );
		let resolver = new CW_PromiseResolver();

		return new Promise( 
			( resolve, reject ) => 
			{
				resolver.resolve_checkWebsiteAvailability( resolve, reject, { domain: domain, port: port } );
			});
	} // checkWebsiteAvailability()

	/**
	 * Perform a whois query for the given domain. Currently (only) used to check pending domaind expiration.
	 * 
	 * IMPORTANT NOTE: The keys and values that are returned by the query are strings that have no rules from registrar from registrar or OS to OS (the implementation of the local whois executable makes a difference). This parser is likely to fail for some registrars.
	 * 
	 * TODO: Update this so a caller can tell the parser which bit of data it wants returned.
	 * 
	 * @author costmo
	 * @returns Promise
	 * @param {*} domain		The domain name to lookup 
	 */
	async getWhoisInfo( { domain = null } )
	{
		let CW_PromiseResolver = require( "./CW_PromiseResolver" );
		let resolver = new CW_PromiseResolver();
		
		return new Promise(
			( resolve, reject ) =>
			{
				resolver.resolve_getWhoisInfo( resolve, reject, { domain: domain } );
			}
		);
	}

	/**
	 * Perform a `dig` query to get domain information
	 * 
	 * @returns Promise
	 * @param {*} domain		The domain/URL to query
	 * @param {*} recordType	The type of record to find ("A", "CNAME", "MX" etc.)
	 * @param {*} queryServer	The server to query. If null, will use the current user's configured DNS server
	 */
	async checkDomain( { domain = null, recordType = null, queryServer = null } )
	{
		let CW_PromiseResolver = require( "./CW_PromiseResolver" );
		let resolver = new CW_PromiseResolver();

		return new Promise(
			( resolve, reject ) =>
			{
				resolver.resolve_checkDomain( resolve, reject, { domain: domain, recordType: recordType, queryServer: queryServer } );
			}
		);
	}


}

module.exports = CW_Network;