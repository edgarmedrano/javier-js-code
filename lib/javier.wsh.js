/*------------------------------------------------------------------------
  File:        javier.wsh.js
  Description: JAVIER Browser JScript version
  Author:      Edgar Medrano Pérez 
               edgarmedrano at gmail dot com
  Created:     2007.04.06
  Company:     JAVIER project
               http://javier.sourceforge.net
  Notes:       
------------------------------------------------------------------------*/

_load = function (libRelativePath) {
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var libPath = fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName),libRelativePath);
	var f;
	try {
		var f = fso.OpenTextFile(libPath,1 /*for reading*/);
	} catch(e) {
		return "";
	}
	return f.ReadAll();
}

eval(_load("handlers.wsh.js"));
eval(_load("javier.js"));

eval(_load("javier.properties.js"));

function JavierBrowser
	(__javier__
	,__input__
	,__output__
	,__error__
	,__network__
	,__log__
	) {

	function __document__(url) {	
		this.url = url ? url : "";
		this.method = "";
		this.enctype = "";
		this.timeout = 0;
		this.maxage = 0;
		this.maxstale = 0;
		this.timeout = 0;
		this.text = "";
		this.xml = { nodeName: "", childNodes: [] };
		this.js = "";
		this.execute = function() { return ""; };
	}
	
	__browser__ = this;
	this.logLevel = 4; /* 0 to 4 = none to verbose */
	this.autoEval = true;
	this.document = new __document__();
	
	this.load = function(docURL) {
		if(typeof(docURL) == "string") {
			this.document = new __document__(docURL);
		} else if(docURL instanceof __document__) {
			this.document = docURL;
		} else {
			return false;
		}
		
		if(this.document.url != "") {
			this.urlCallback(this.document.url);
			try {
				return __network__.loadXML
					(this.document.url
					,this.document.method
					,this.document.enctype
					,this
					,this.parse
					,this.loadCallback
					,this.document.timeout
					,this.document.maxage
					,this.document.maxstale
					,this.document.timeout);
			} catch(e) {
				this.error(this,"Unable to load document: " + this.document.url); 
			}
			
			return false;
		} else {
			this.end(0);
		}
		
		return false;
	}
	
	this.loadCallback = function (readyState) { /* Default do nothing */ }
	this.errorCallback = function (description) { /* Default do nothing */ }
	this.warningCallback = function (description) { /* Default do nothing */ }
	this.commentCallback = function (description) { /* Default do nothing */ }
	this.describeCallback = function (description) { /* Default do nothing */ }
	this.readyCallback = function (readyState) { /* Default do nothing */ }
	this.urlCallback = function (url) { /* Default do nothing */ }
	this.endCallback = function (endCode) { /* Default do nothing */ }
	
	this.parse = function (xml, objRef) {
		if(xml) {
			if(typeof(xml) == "string") {
				objRef.error(objRef,"Execution error: " + xml);
				this.end(1);
			} else {
				try {
					objRef.document.text = __network__.getText();
					objRef.document.xml = xml;
					__javier__.setBrowser(objRef);
					objRef.document.js = __javier__.parse(xml);
					objRef.document.execute = new Function(objRef.document.js);
					objRef.readyCallback();
					if(objRef.autoEval) {
						objRef.run(objRef.document);
					}
				} catch(e) {
					objRef.error(objRef,"Execution error: " + (e.message ? e.message : e));
					this.end(1);
				}
			}
		} else {
			objRef.error(objRef,"Unable to load document: " + objRef.document.url);
			this.end(1);
		}
	}
	
	this.run = function (docURL) {
		try {
			docURL = docURL.execute();
			this.load(docURL);
		} catch(e) {
			if(e == "error"
				|| e == "exit"
				|| e == "telephone.disconnect") {
				/*Do nothing*/
				this.end(0);
			} else {
				this.error("Error: " + (e.number ? e.number : "") + (e.message ? e.message : e));
				this.end(1);
			}
		}
	}
	
	this.end = function (endCode) {
		__output__.waitUntilDone();
		this.endCallback(endCode);
	}
	
	this.getInput = function(text) {
		var result = __input__.getInput(text);
		__output__.clearText();
		return result;
	}
	
	this.addText = function(text) {
		__output__.addText(text);
	}
	
	this.clearText = function() {
		__output__.clearText();
	}
	
	this.log = function(source, text, level) {
		if(level <= this.logLevel) {
			var sourceType = ("" + source.constructor).match(/\s*function\s+(.*)\(.*/);
			
			if(sourceType && sourceType.length < 2) {
				sourceType = "Anonymous";
			} else {
				sourceType = sourceType[1];
			}
			
			__log__.writeln(sourceType + ": " + text);
		}
	}
	
	this.error = function(source, text) {
		var sourceType = ("" + source.constructor).match(/\s*function\s+(.*)\(.*/);
		
		if(sourceType && sourceType.length < 2) {
			sourceType = "Anonymous";
		} else {
			sourceType = sourceType[1];
		}
		
		this.log(sourceType,text,1);
		__error__.writeln(sourceType + ": " + text);
		this.errorCallback(text);
	}
	
	this.warning = function(source, text) {
		this.log(source,text,2);
		this.warningCallback(text);
	}
	
	this.comment = function(source, text) {
		this.log(source,text,3);
		this.commentCallback(text);
	}
	
	this.describe = function(source, text) {
		this.log(source,text,4);
		this.describeCallback(text);
	}
	
	this.setProperty = function(name, value) {
		this[name] = value;
	}
	
	this.getQuery = function (_get, url, namelist) {
		var separator = url.indexOf("?") >= 0 ? "&" : "?";
		url = url.split("#");
		namelist = namelist.split(" ");
		for(var i=0; i < namelist.length; i++) {
			url[0] += separator + namelist[i] + "=" + _get(namelist[i]);
			if(separator == "?") {
				separator = "&";
			}
		}
		
		return url.join("#");
	}
}

var _AppURL = "default.vxml";
var _Voice = "";

if(WScript.Arguments.Count() == 0) {
	Wscript.StdOut.Write("AppURL: ");
	_AppURL = WScript.StdIn.ReadLine();
} else {
	_AppURL = WScript.Arguments.Item(0);
	if(WScript.Arguments.Count() == 1) {
		Wscript.StdOut.Write("Voice: ");
		_Voice = WScript.StdIn.ReadLine();
	} else {
		_Voice = WScript.Arguments.Item(1);	
	}
}

var __browser__ = new JavierBrowser
	(new Javier()
	,new WSInHandler()
	,new WSOutHandler(_Voice)
	,new WSErrHandler()
	,new NetHandler()
	,new WSLogHandler(WScript.ScriptFullName + ".log")
	);
/*	
__browser__.loadCallback = function (readyState) { AGIHandler.verbose("Loading: " + readyState); }
__browser__.errorCallback = function (description) { AGIHandler.verbose("Error: " + description); }
__browser__.warningCallback = function (description) { AGIHandler.verbose("Warning: " + description); }
__browser__.commentCallback = function (description) { AGIHandler.verbose("Comment: " + description); }
__browser__.describeCallback = function (description) { AGIHandler.verbose("Describe: " + description); }
__browser__.readyCallback = function (readyState) { AGIHandler.verbose("Ready: " + readyState); }
__browser__.urlCallback = function (url) { AGIHandler.verbose("URL change: " + url); }	
*/
__browser__.endCallback = function (endCode) { WScript.Quit(endCode); }	

try {
	__browser__.load(WScript.Arguments.Item(0));
	while(__browser__.document.url != "") {
		WScript.Sleep(1000);
	}
} catch(e) {
	WScript.Echo("Error: " + (e.number ? e.number : "") + (e.message ? e.message : e));
	WScript.Quit(1);
}
