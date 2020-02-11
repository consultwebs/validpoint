module.exports = 
{
	"http-response":
	{
		"URGENT": 		"Your website is currently responding with an invalid response code: %raw_response%. People will not be able to reach your website using this address. Please contact your hosting provider for support",
		"NOTICE":		"Your website is currently redirecting to an address that does not contain your domain name. The current redirect location is: %raw_response% If this is an issue, contact your hosting provider.",
		"NO_RESPONSE":
		{
			"URGENT": 	"Your website is currently not responding. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		},
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
		"NOTICE":		"Your secure website is currently redirecting to an address that does not contain your domain name. The current redirect location is %raw_response%. If this is an issue, contact your hosting provider.",
		"NO_RESPONSE":
		{
			"URGENT": 	"Your secure website is currently not responding. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		},
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
		"URGENT": 		"Your web server is currently not accepting connections for your domain. People will not be able to reach your website using this address. Please contact your hosting provider for support",
		"NO_RESPONSE":
		{
			"URGENT": 	"Your website is currently not responding. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		},
		"NOT_FOUND":
		{
			"URGENT": 	"Your website could not be reached. Please contact your hosting provider for support"
		},
		"TIMED_OUT":
		{
			"URGENT": 	"Your website never responded. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		},
		"REPLACEMENT":
		{
			"NOTICE": 	"Your website is currently responding with an invalid: %response% People may not be able to reach your website using this address, and there may be a significant SEO impact. Please contact your hosting provider for support"
		}
	},
	"secure-website":
	{
		"URGENT": 		"Your secure web server is currently not accepting connections for your domain. People will not be able to reach your website using this address. Please contact your hosting provider for support",
		"NO_RESPONSE":
		{
			"URGENT": 	"Your secure website is currently not responding. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		},
		"TIMED_OUT":
		{
			"URGENT": 	"Your secure website never responded. People will not be able to reach your website using this address. Please contact your hosting provider for support"
		},
		"REPLACEMENT":
		{
			"NOTICE": 	"Your secure website is currently responding with an invalid response: %response% People may not be able to reach your website using this address, and there may be a significant SEO impact. Please contact your hosting provider for support"
		}
	},
	"website-content":
	{
		"NO_HTML":
		{
			"URGENT": "No HTML tag was detected in the content of your website. This means that your website will not work well, if at all. Contact your website developer immediately for assistance."
		},
		"HEAD_NONE":
		{
			"NOTICE": "Your website does not have a HEAD tag. This has a serious impact on SEO ranking. Contact your website developer for help."
		},
		"TITLE_NONE":
		{
			"URGENT": "Your website does not have a TITLE tag. This has a serious impact on SEO ranking. Contact your website developer for help."
		},
		"BODY_NONE":
		{
			"URGENT": "Your website does not have a BODY tag. This has a serious impact on SEO ranking, and people may not be able to view your website. Contact your website developer for help."
		},
		"H1_NONE":
		{
			"NOTICE": "Your website does not have an H1 tag. This has a serious impact on SEO ranking. Contact your website developer for help."
		},
		"NOINDEX":
		{
			"NOTICE": "Your website currently has NOINDEX set, so search engines will not index your content. This has a serious impact on SEO ranking. Contact your website developer for help."
		}
	}
};