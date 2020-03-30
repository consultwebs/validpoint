"use strict";
/**
 * Offering advice for "website" tests
 * 
 * These tests will be a little more complicated than "local"
 * 
 * @author costmo
 */

let CW_Constants=require("./CW_Constants");

let CW_AdviceContent=require("./CW_AdviceContent");
class CW_AdviceContent_Website extends CW_AdviceContent
{
/**
	 * Create an instance for a finished command and testResult
	 * 
	 * @param {*} command		The command that has finished
	 * @param {*} testResult	A test_result object to parse 
	 * @param {*} configObject	A user's config object
	 */
constructor({command=null,testResult=null,configObject=null})
{
super({
category:"website",
command:command,
testResult:testResult});


this.configObject=configObject;

}

/**
	 * Advice content hub for "website" requests.
	 * 
	 * Once an Advice object has its test results, the parser runs this category-specific method to 
	 *   produce an action object
	 * 
	 * @author costmo
	 * 
	 */
advise()
{
// The only PUNT condition is a redirect
if(this.test_result.result==CW_Constants.RESULT_PUNT)
{
// If the redirect points to something other than the user's domain, set the severity
if(this.test_result.raw_response.raw_response.indexOf(this.configObject.domain)>-1)
{
this.test_result.result=CW_Constants.RESULT_PASS;
}
}

// Got a direct message back from a system error
if(this.test_result.result==CW_Constants.RESULT_FAIL&&
this.test_result.raw_response.message&&this.test_result.raw_response.message.length>0)
{
this.severity=CW_Constants.SEVERITY_DIRECT_MESSAGE;
this.content=this.test_result.raw_response.message;
}else

{
if(this.command=="website-content")
{
let tags=this.resultTagsForContent({inputObject:this.test_result.raw_response});

// Nothing was wrong
if(tags.length<1)
{
this.severity=this.resultTagToSeverity({resultTag:CW_Constants.RESULT_PASS});
this.content=this.contentForSeverity({severity:this.severity});
}else

{
// handle more complicated severity determinations
this.content="";
tags.forEach(
(tag)=>
{
let severity=this.resultTagToSeverity({resultTag:tag.result_value,extraKey:tag.intermediate_key});
if(severity>this.severity)
{
this.severity=severity;
this.test_result.result=tag.result_value;
}

this.content+=this.contentForSeverity({severity:severity,extraInput:tag.intermediate_key})+"\n";
this.result=tag.result_value;
});

}
}else
if((this.command=="http-response"||this.command=="https-response"||
this.command=="website"||this.command=="secure-website")&&(

this.test_result.raw_response.raw_response=="NO_RESPONSE"||// raw_response for http(s)-response generated objects is an object containing a raw_response
this.test_result.raw_response=="NOT_FOUND"||
this.test_result.raw_response=="TIMED_OUT"))
{
let extraInput=this.command.indexOf("http")===0?this.test_result.raw_response.raw_response:this.test_result.raw_response;

this.severity=this.resultTagToSeverity({resultTag:this.test_result.result});
this.content=this.contentForSeverity({severity:this.severity,extraInput:extraInput});
}else
if(this.command=="website"||this.command=="secure-website")// website command passed useful information from the test back to here
{
let extraInput=this.test_result.raw_response;

this.severity=this.resultTagToSeverity({resultTag:this.test_result.result,extraKey:"REPLACEMENT"});
this.content=this.contentForSeverity({severity:this.severity,extraInput:"REPLACEMENT"});
this.content=this.content.replace('%response%',this.test_result.raw_response);
}else

{
this.severity=this.resultTagToSeverity({resultTag:this.test_result.result});
this.content=this.contentForSeverity({severity:this.severity});
}
}


}

/**
	 * Provide the content for the discovered severity on the current instance's command.
	 * 
	 * Commands in the "local" category only need content for ESSENTIAL and URGENTt
	 * 
	 * @author costmo
	 * @param {*} severity		The severity for which content is needed 
	 * @param {*} extraInput	Extra input needed to form a more precise response
	 */
contentForSeverity({severity=null,extraInput=null})
{
let strings=require("./strings/category.website.js");

switch(severity){

case CW_Constants.SEVERITY_NOTICE:
if(extraInput&&
undefined!=strings[this.command][extraInput][CW_Constants.NAME_SEVERITY_NOTICE])
{
return strings[this.command][extraInput][CW_Constants.NAME_SEVERITY_NOTICE];
}else

{
return strings[this.command][CW_Constants.NAME_SEVERITY_NOTICE];
}
case CW_Constants.SEVERITY_ESSENTIAL:
case CW_Constants.SEVERITY_URGENT:
if(extraInput&&
undefined!=strings[this.command][extraInput][CW_Constants.NAME_SEVERITY_URGENT])
{
return strings[this.command][extraInput][CW_Constants.NAME_SEVERITY_URGENT];
}else

{
return strings[this.command][CW_Constants.NAME_SEVERITY_URGENT];
}
default:
return"";}

}

/**
	 * Override default "tag to severity" mapping for this specific "local" request
	 * 
	 * Uses the system default for anything other than "FAIL"
	 * 
	 * @param {*} resultTag				The result tag to map  
	 * @param {*} extraKey				An optional extra key to help refine the lookup
	 */
resultTagToSeverity({resultTag=null,extraKey=null})
{
switch(resultTag){

// PUNT will happen if there is a redirect and the redirect location domain does not match
case"PUNT":
return CW_Constants.SEVERITY_NOTICE;
case"FAIL":
if(extraKey&&extraKey.length>0)
{
switch(extraKey){

case"HEAD_NONE":
case"H1_NONE":
case"NOINDEX":
case"REPLACEMENT":
return CW_Constants.SEVERITY_NOTICE;
default:
return CW_Constants.SEVERITY_URGENT;}

}else
// end if( extraKey && extraKey.length > 0 ) for case: FAIL
{
return CW_Constants.SEVERITY_URGENT;
}
default:
return super.resultTagToSeverity({resultTag:resultTag});}

}

/**
	 * A string of tests to run gathered test info to look for problems.
	 * 
	 * @returns Array
	 * @author costmo
	 * @param {*} inputObject			The raw_response from the runner 
	 */
resultTagsForContent({inputObject=null})
{
let returnValue=[];

// We get a DOM tree if there are real results to examine. Otherwise, there was an error getting the DOM
if(typeof inputObject!=="object")
{
returnValue.push(
{
intermediate_key:inputObject,
result_value:CW_Constants.RESULT_FAIL});



return returnValue;
}

// A series of things that should be present in the HTML
if(!inputObject.headNode.childNodes||
inputObject.headNode.childNodes.length<1)
{
returnValue.push(
{
intermediate_key:"HEAD_NONE",
result_value:CW_Constants.RESULT_FAIL});


}

if(!inputObject.titleNode.childNodes||
inputObject.titleNode.childNodes.length<1||
inputObject.titleNode.rawText.length<1)
{
returnValue.push(
{
intermediate_key:"TITLE_NONE",
result_value:CW_Constants.RESULT_FAIL});


}

if(!inputObject.bodyNode.childNodes||
inputObject.bodyNode.childNodes.length<1||
inputObject.bodyNode.rawText.length<1)
{
returnValue.push(
{
intermediate_key:"BODY_NONE",
result_value:CW_Constants.RESULT_FAIL});


}

// We're only checking for 1
if(!inputObject.h1Node.childNodes||
inputObject.h1Node.childNodes.length<1/*|| // requires separate parsing if there's more than one
			(inputObject.h1Node.rawText.length < 1)*/)
{
returnValue.push(
{
intermediate_key:"H1_NONE",
result_value:CW_Constants.RESULT_FAIL});


}

// walk through meta tags to find a "noindex"
if(inputObject.metaNodes&&
inputObject.metaNodes.length>0)
{
inputObject.metaNodes.forEach(
(node)=>
{
if(node.rawAttrs.indexOf("noindex")>-1)
{
returnValue.push(
{
intermediate_key:"NOINDEX",
result_value:CW_Constants.RESULT_FAIL});


}

});

}

return returnValue;
}

/**
	 * Offers advice while tests are in-progress
	 * 
	 * @returns	mixed			Returns an objcet or prints to the screen
	 * @author costmo
	 * 
	 * @param {*} testKey		A key to identify what is being tested
	 * @param {*} configObject	A constructed configuration object
	 * @param {*} returnType	"screen" to display the results, anything else to get an object 
	 */
inProgressAdvice({testKey=null,configObject=null,returnType="screen"})
{
let returnValue={
printAnswer:"",
printSubject:"",
printDetail:""};


let severity=0;
let serverArray=[];
let tags=[];
if(!configObject.be_quiet)
{
// which test to run
switch(testKey){

case"SSL":
process.stdout.write("Finding SSL grade...   ".header);

if(this.test_result.raw_response.grade)
{
process.stdout.write("good\n".ok);
process.stdout.write("Received grade: ".text);
process.stdout.write(this.test_result.raw_response.grade.ok+"\n\n");
}else

{
process.stdout.write("failed\n".error);
process.stdout.write(this.test_result.raw_response.message.error+"\n\n");
}

break;
case"SSL_EXPIRATION":
if(this.test_result.result==CW_Constants.RESULT_FAIL)
{
process.stdout.write("failed\n".error);
process.stdout.write(this.test_result.raw_response.message.error+"\n\n");
}else
if(this.test_result.raw_response.daysLeft>30)
{
process.stdout.write("good\n".ok);
process.stdout.write("Days until expiration: ".text);
process.stdout.write(this.test_result.raw_response.daysLeft.toString().result+"\n\n");
}else
if(this.test_result.raw_response.daysLeft>0)
{
process.stdout.write("warning\n".warn);
process.stdout.write("Days until expiration: ".warn);
process.stdout.write(this.test_result.raw_response.daysLeft.toString().warn+"\n");

severity=this.resultTagToSeverity({resultTag:CW_Constants.RESULT_PUNT});
let content=this.contentForSeverity({severity:severity,extraInput:"EXPIRE_SOON"});

process.stdout.write(content.warn+"\n\n");
}else

{
process.stdout.write("expired\n".error);

severity=this.resultTagToSeverity({resultTag:CW_Constants.RESULT_FAIL});
let content=this.contentForSeverity({severity:severity,extraInput:"EXPIRED"});

process.stdout.write(content.error+"\n\n");
}

break;
// TODO: These conditions need to be refactored
case"WEBSITE_CONTENT":
// Show a header
tags=[];


// We got an empty response
if(typeof this.test_result.raw_response!=="object")
{
tags.push(
{
intermediate_key:this.test_result,
result_value:CW_Constants.RESULT_FAIL});


}else

{
let content="";

// These can all be done at once, but are separated here to show "progress"
process.stdout.write("Looking for HTML \"HEAD\" tag...   ".header);
if(!this.test_result.raw_response.headNode.childNodes||
this.test_result.raw_response.headNode.childNodes.length<1)
{
process.stdout.write("failed\n".error);
severity=this.resultTagToSeverity({resultTag:CW_Constants.RESULT_FAIL});
content=this.contentForSeverity({severity:severity,extraInput:"HEAD_NONE"});
process.stdout.write(content.error+"\n\n");
}else

{
process.stdout.write("good\n\n".ok);
}

process.stdout.write("Looking for HTML \"BODY\" tag...   ".header);
if(!this.test_result.raw_response.bodyNode.childNodes||
this.test_result.raw_response.bodyNode.childNodes.length<1||
this.test_result.raw_response.bodyNode.rawText.length<1)
{
process.stdout.write("failed\n".error);
severity=this.resultTagToSeverity({resultTag:CW_Constants.RESULT_FAIL});
content=this.contentForSeverity({severity:severity,extraInput:"BODY_NONE"});
process.stdout.write(content.error+"\n\n");
}else

{
process.stdout.write("good\n\n".ok);
}

process.stdout.write("Looking for HTML \"TITLE\" tag...   ".header);
if(!this.test_result.raw_response.titleNode.childNodes||
this.test_result.raw_response.titleNode.childNodes.length<1||
this.test_result.raw_response.titleNode.rawText.length<1)
{
process.stdout.write("failed\n".error);
severity=this.resultTagToSeverity({resultTag:CW_Constants.RESULT_FAIL});
content=this.contentForSeverity({severity:severity,extraInput:"TITLE_NONE"});
process.stdout.write(content.error+"\n\n");
}else

{
process.stdout.write("good\n\n".ok);
}


process.stdout.write("Looking for HTML \"H1\" tag...   ".header);
if(!this.test_result.raw_response.h1Node.childNodes||
this.test_result.raw_response.h1Node.childNodes.length<1)
{
process.stdout.write("warning\n".warn);
severity=this.resultTagToSeverity({resultTag:CW_Constants.RESULT_PUNT});
let content=this.contentForSeverity({severity:severity,extraInput:"H1_NONE"});

process.stdout.write(content.warn+"\n\n");
}else

{
process.stdout.write("good\n\n".ok);
}

let foundNoindex=false;
process.stdout.write("Looking for HTML \"NOINDEX\" tag...   ".header);
if(this.test_result.raw_response.metaNodes&&
this.test_result.raw_response.metaNodes.length>0)
{
this.test_result.raw_response.metaNodes.forEach(
(node)=>
{
if(node.rawAttrs.indexOf("noindex")>-1)
{
foundNoindex=true;
}

});


if(foundNoindex)
{
process.stdout.write("warning\n".warn);
severity=this.resultTagToSeverity({resultTag:CW_Constants.RESULT_PUNT});
let content=this.contentForSeverity({severity:severity,extraInput:"NOINDEX"});

process.stdout.write(content.warn+"\n\n");
}else

{
process.stdout.write("good\n\n".ok);
}

}
}
break;// case "WEBSITE_CONTENT":
case"WEBSITE_AVAILABILITY":
let extraInput=this.test_result.raw_response;
let CW_PromiseResolver=require("./CW_PromiseResolver");

process.stdout.write("Testing port availability...   ".header);
if(parseFloat(extraInput.raw_response.avg)+""!=="NaN")
{
process.stdout.write("good\n".ok);

if(extraInput.raw_response.avg>CW_PromiseResolver.MAX_HTTTP_RESPONSE_TIME)
{
process.stdout.write("Response time: ".header+extraInput.raw_response.avg.toString().warn+"ms\n".warn);
process.stdout.write(this.contentForSeverity({severity:CW_Constants.SEVERITY_NOTICE,extraInput:"TIMED_OUT"}).warn+"\n");
}else

{
process.stdout.write("Response time: ".header+Math.ceil(extraInput.raw_response.avg).toString().result+"ms\n".result);
}
}else

{
process.stdout.write("good\n\n".ok);
}

break;// case "WEBSITE_AVAILABILITY":
case"WEBSITE_RESPONSE":
let responseInput=this.test_result.raw_response;

process.stdout.write("Testing site response status code...   ".header);

if(responseInput.result==CW_Constants.RESULT_PUNT)// handle redirect -- 4xx and 5xx responses show up as errors
{

if(responseInput.raw_response.indexOf(configObject.domain)>-1)
{
process.stdout.write("good\n\n".ok);
}else
// Warn/fail on bad response codes 
{
process.stdout.write("warning\n".warn);
process.stdout.write(responseInput.warn+"\n\n");
}
}else
if(responseInput.result==CW_Constants.RESULT_PASS)
{
process.stdout.write("good\n\n".ok);
}else

{
process.stdout.write("fail\n".error);
process.stdout.write(responseInput.error+"\n\n");
}

break;// case "WEBSITE_AVAILABILITY":
}// switch( testKey )
}// if( !configObject.be_quiet )

// output of "screen" is handled through the be_quiet flag
if(returnType!=="screen")
{
return returnValue;
}
}}




module.exports=CW_AdviceContent_Website;