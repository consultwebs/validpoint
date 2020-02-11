module.exports = 
{
	"http-port":
	{
		"URGENT": 		"Your web server is currently not accepting connections for your domain. People will not be able to reach your website using this address. Please contact your hosting provider for support",
		"NOTICE":		"Your web server is taking too long to accept connections, and people are likely to leave your website before waiting for it to load. Please contact your hosting provider for support",
		"NO_RESPONSE":
		{
			"URGENT": "There was no response from your web server's connection port. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		}
	},
	"https-port":
	{
		"URGENT": 		"Your web server is currently not accepting connections for your domain. People will not be able to reach your website using this address. Please contact your hosting provider for support",
		"NOTICE":		"Your web server is taking too long to accept connections, and people are likely to leave your website before waiting for it to load. Please contact your hosting provider for support",
		"NO_RESPONSE":
		{
			"URGENT": "There was no response from your secure web server's connection port. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		}
	},
	"domain":
	{
		"URGENT": 		"There was a problem with your domainm name. Please contact your hosting provider",
		"NS_NONE":
		{
			"URGENT": "There are not any name servers defined for your domain and people will not be able to reach your website. Please contact your web hosting provider for support."
		},
		"TLD_IS_ALIAS":
		{
			"URGENT": "Your top-level domain is currently an alias.  Please contact your web hosting provider for support."
		},
		"WWW_CNAME_NONE":
		{
			"URGENT": "You currently have no CNAME defined for your WWW.  Please contact your web hosting provider for support."
		},
		"MX_NONE":
		{
			"URGENT": "You have no mail servers defined for your domain name, which menas people will not be able to send you emails using your company's unique name.  Please contact your web hosting provider for support."
		},
		"TLD_A_NONE":
		{
			"URGENT": "Your top-level domain is not an A record.  Please contact your web hosting provider for support."
		},
		"DOMAIN_EXPIRED":
		{
			"URGENT": "Your domain name has expired and you may lose access to your website and domain.  Please contact your web hosting provider for support."
		},
		"DOMAIN_WILL_EXPIRE":
		{
			"URGENT": "Your domain name will expire soon. To avoid losing access to your website and domain, contact your web hosting provider."
		}
	}
};