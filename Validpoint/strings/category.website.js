module.exports = 
{
	"http-response":
	{
		"URGENT": 		"Your website is currently responding with an invalid response code: %raw_response%. People will not be able to reach your website using this address. Please contact your hosting provider for support",
		"NOTICE":		"Your website is currently redirecting to an address that does not contain your domain name. The current redirect location is: %raw_response% If this is an issue, contact your hosting provider.",
		"404":
		{
			"URGENT": 		"Your website is currently responding with a \"Page Not Found\" error. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		},
		"500":
		{
			"URGENT": 		"Your website is currently responding with a \"500\" error, meaning that it has encountered an unknown technical error. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		}
	},
	"https-response":
	{
		"URGENT": 		"Your secure website is currently responding with an invalid response code: %raw_response%. People will not be able to reach your website using this address. Please contact your hosting provider for support",
		"REDIRECT":		"Your secure website is currently redirecting to an address that does not contain your domain name. The current redirect location is %raw_response%. If this is an issue, contact your hosting provider.",
		"404":
		{
			"URGENT": 		"Your secure website is currently responding with a \"Page Not Found\" error. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		},
		"500":
		{
			"URGENT": 		"Your secure website is currently responding with a \"500\" error, meaning that it has encountered an unknown technical error. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		}
	},
	"website":
	{
		"URGENT": 		"Your web server is currently not accepting connections for your domain. People will not be able to reach your website using this address. Please contact your hosting provider for support"
	},
	"secure-website":
	{
		"URGENT": 		"Your secure web server is currently not accepting connections for your domain. People will not be able to reach your website using this address. Please contact your hosting provider for support"
	}
};