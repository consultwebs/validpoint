"use strict";let CW_Constants=require("./CW_Constants.js");
const colors=require("../node_modules/colors");
colors.setTheme(CW_Constants.COLOR_THEME);

/**
 * Parent class for providing advice content. Individual categories should subclass
 * 
 * @author costmo
 */
class CW_AdviceContent
{
/**
	 * Create an instance of the AdviceContent class
	 * 
	 * @param {object} input					Named parameters for input
	 * @param {string} input.category		The category of the command
	 * @param {string} input.command		The command that s being run
	 * @param {object} input.testResult		A test_result object to pass around
	 */
constructor({category=null,command=null,testResult=null})
{
/**
		 * The category of the command
		 * 
		 * @type {string}
		 */
this.category=category;
this.command=command;
this.severity=CW_Constants.SEVERITY_IGNORE;
this.test_result=testResult;
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
throw new Error("Improper use of CW_AdviceContent.advise(). Implement this functionality in a subclass.");
}

/**
	 * Map a severity level to the result tag
	 * 
	 * This sets the default severity levels for the system. Children should override states that need to return \
	 * something different than the default for a given severity, depending on global and local congifuration
	 * 
	 * @author costmo
	 * @returns {number}					The constant resolving to the given severity
	 * @param {string} resultTag				The result tag to map 
	 */
resultTagToSeverity({resultTag=null})
{
switch(resultTag){

case"PASS":
return CW_Constants.SEVERITY_OK;
case"FAIL":
return CW_Constants.SEVERITY_NOTICE;
case"PUNT":
return CW_Constants.SEVERITY_IGNORE;
case"UNTESTED":
return CW_Constants.SEVERITY_IGNORE;
default:
return CW_Constants.SEVERITY_IGNORE;}

}

/**
	 * Show an in-progress title, gated by runtime configuration
	 * 
	 * @author costmo
	 * @param {object} input					Named parameters for input
	 * @param {object} input.configObject		A configuration object
	 * @param {string} input.input				The string to show
	 */
static progressTitle({configObject=null,input=null})
{
if(!configObject||configObject.be_quiet===false||configObject.quiet===false)
{
process.stdout.write(input.title+"\n");
}
}

/**
	 * Show an in-progress string, gated by runtime configuration
	 * 
	 * @author costmo
	 * @param {object} input					Named parameters for input
	 * @param {object} input.configObject		A configuration object
	 * @param {string} input.input				The string to show
	 */
static progressContent({configObject=null,input=null})
{
if(!configObject||configObject.be_quiet===false)
{
process.stdout.write(input);
}
}

/**
	 * Show an in-progress "OK" result, gated by runtime configuration
	 * 
	 * @author costmo
	 * @param {object} input					Named parameters for input
	 * @param {object} input.configObject		A configuration object
	 * @param {string} input.input				The string to show
	 */
static progressResult({configObject=null,input=null})
{
if(!configObject||configObject.be_quiet===false)
{
process.stdout.write(input.ok+"\n");
}
}

/**
	 * Spin work off to helper/child classes to get specific advice
	 * 
	 * @author costmo
	 * @param {object} input					Named parameters for input
	 * @param {object} input.configObject		A configuration object
	 * @param {object} input.adviceObject		A populated Advice object
	 * @param {string} input.testKey			An extra string to use as an intermediate key in finding the correct output
	 */
static progressAdvice({configObject=null,adviceObject=null,testKey=null})
{
// Don't go further if we aren't going to show output
// if( configObject.be_quiet === false )
{
// Create an instance of one of this class' children to get in-progress advice
let ChildClass=null;
let child=null;

if(adviceObject.item_result.category=="website-admin")
{
ChildClass=require("./CW_AdviceContent_WebsiteAdmin");
if(adviceObject.domainResponses)
{
child=new ChildClass({command:adviceObject.item_result.command,testResult:adviceObject.domainResponses,configObject:configObject});
}else
if(adviceObject.item_result)
{
child=new ChildClass({command:adviceObject.item_result.command,testResult:adviceObject.item_result,configObject:configObject});
}

}else
if(adviceObject.item_result.category=="website")
{
ChildClass=require("./CW_AdviceContent_Website");
child=new ChildClass({command:adviceObject.item_result.command,testResult:adviceObject.item_result,configObject:configObject});
}else
if(adviceObject.item_result.category=="local")
{
ChildClass=require("./CW_AdviceContent_Local");
child=new ChildClass({command:adviceObject.item_result.command,testResult:adviceObject.item_result,configObject:configObject});
}

if(child!=null)
{
child.inProgressAdvice({testKey:testKey,configObject:configObject,returnType:"screen"});
}
}
}}



module.exports=CW_AdviceContent;