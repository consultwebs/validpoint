"use strict";module.exports=
{
"http-port":
{
"URGENT":"Your web server is currently not accepting connections for your domain. People will not be able to reach your website using this address. Please contact your hosting provider for support",
"NOTICE":"Your web server is taking too long to accept connections, and people are likely to leave your website before waiting for it to load. Please contact your hosting provider for support",
"NO_RESPONSE":
{
"URGENT":"There was no response from your web server's connection port. People will not be able to reach your website using this address. Please contact your hosting provider for support"},

"TIMED_OUT":
{
"NOTICE":"Your website took too long to respond. People may not be able to reach your website using this address. Please contact your hosting provider for support",
"URGENT":"Your website took too long to respond. People may not be able to reach your website using this address. Please contact your hosting provider for support"}},


"https-port":
{
"URGENT":"Your web server is currently not accepting connections for your domain. People will not be able to reach your website using this address. Please contact your hosting provider for support",
"NOTICE":"Your web server is taking too long to accept connections, and people are likely to leave your website before waiting for it to load. Please contact your hosting provider for support",
"NO_RESPONSE":
{
"URGENT":"There was no response from your secure web server's connection port. People will not be able to reach your website using this address. Please contact your hosting provider for support"},

"TIMED_OUT":
{
"NOTICE":"Your website took too long to respond. People may not be able to reach your website using this address. Please contact your hosting provider for support",
"URGENT":"Your website took too long to respond. People may not be able to reach your website using this address. Please contact your hosting provider for support"}},


"domain":
{
"URGENT":"There was a problem with your domain name. Please contact your hosting provider",
"NO_ANSWER":
{
"URGENT":"There was no response about your domain when we performed a 'dig' for information. People will not be able to reach your website until this is resolved. Please contact your web hosting provider for support."},

"NO_WHOIS":
{
"URGENT":"A whois server was unable to find your domain. People will not be able to reach your website until this is resolved. Please contact your web hosting provider for support."},

"NS_NONE":
{
"URGENT":"There are not any name servers defined for your domain and people will not be able to reach your website. Please contact your web hosting provider for support."},

"TLD_IS_ALIAS":
{
"URGENT":"Your top-level domain is currently an alias.  Please contact your web hosting provider for support."},

"WWW_CNAME_NONE":
{
"URGENT":"You currently have no CNAME defined for your WWW.  Please contact your web hosting provider for support."},

"WWW_A_NONE":
{
"URGENT":"You currently have no CNAME defined for your WWW.  Please contact your web hosting provider for support.",
"NOTICE":"You currently have no CNAME defined for your WWW address. This may be acceptable, but isn't the norm. You should contact your hosting provider if you are unsure."},

"WWW_CNAME_A_NONE":
{
"URGENT":"Your \"WWW\" address doesn't have an \"A\" record or a \"CNAME\" which means that people who try to reach your domain using \"www\" will not get to your website. Please contact your hosting provider for support."},

"MX_NONE":
{
"URGENT":"You have no mail servers defined for your domain name, which menas people will not be able to send you emails using your company's unique name.  Please contact your web hosting provider for support."},

"TLD_A_NONE":
{
"URGENT":"Your top-level domain is not an A record.  Please contact your web hosting provider for support."},

"TLD_CNAME_NONE":
{
"OK":"Your top-level domain does not have a \"CNAME\" record, which is normal."},

"DOMAIN_EXPIRED":
{
"URGENT":"Your domain name has expired and you may lose access to your website and domain.  Please contact your web hosting provider for support."},

"DOMAIN_WILL_EXPIRE":
{
"URGENT":"Your domain name will expire soon. To avoid losing access to your website and domain, contact your web hosting provider.",
"NOTICE":"Your domain name will expire soon. To avoid losing access to your website and domain, contact your web hosting provider."}}};