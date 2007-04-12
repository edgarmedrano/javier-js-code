/*------------------------------------------------------------------------
  File:        javier.wsh.agi.js
  Description: JAVIER Browser JScript version + AGI
  Author:      Edgar Medrano P�rez 
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

eval(_load("stdio.wsh.js"));
eval(_load("agi.js"));
eval(_load("handlers.agi.js"));
eval(_load("javier.js"));

eval(_load("javier.properties.js"));

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

function JavierBrowser
	(__javier__
	,__input__
	,__output__
	,__error__
	,__network__
	,__log__
	) {
	
	__browser__ = this;
	this.logLevel = 4; /* 0 to 4 = none to verbose */
	this.autoEval = true;
	this.document = new __document__();
	this.loading = true;
	
	this.load = function(docRef) {
		this.loading = true;
	/*
		if(typeof(docURL) == "string") {
			this.document = new __document__(docURL);
		} else if(docURL instanceof __document__) {
			this.document = docURL;
		} else {
			return false;
		}
	*/	
		if(docRef.url != "") {
			this.urlCallback(docRef.url);
			try {
				return __network__.loadXML
					(docRef.url
					,docRef.method
					,docRef.enctype
					,this
					,this.parse
					,this.loadCallback
					,docRef.timeout
					,docRef.maxage
					,docRef.maxstale
					,docRef.timeout);
			} catch(e) {
				this.error(this,"Unable to load document: " + docRef.url); 
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
	
	this.parse = function (xml) {
		WScript.Echo("parse");
		if(xml) {
			if(typeof(xml) == "string") {
				this.error(this,"Execution error: " + xml);
				this.end(1);
			} else {
				try {
					this.document.text = __network__.getText();
					this.document.xml = xml;
					__javier__.setBrowser(this);
					this.document.js = __javier__.parse(xml);
					this.document.execute = new Function(this.document.js);
					this.readyCallback();
					if(this.autoEval) {
						this.run(this.document);
					}
				} catch(e) {
					this.error(this,"Execution error: " + (e.number ? e.number : "") + " " + (e.message ? e.message : e));
					this.end(1);
				}
			}
		} else {
			this.error(this,"Unable to load document: " + this.document.url);
			this.end(1);
		}
	}
	
	this.run = function (docURL) {
		WScript.Echo("run");

		try {
			docURL = docURL.execute();
		WScript.Echo("docURL" + docURL);
			if(typeof(docURL) == "string") {
				this.document = new __document__(docURL);
			} else if(docURL instanceof __document__) {
				this.document = docURL;
			}
			//this.load(docURL);
			this.loading = false;
		} catch(e) {
			if(e == "error"
				|| e == "exit"
				|| e == "telephone.disconnect") {
				/*Do nothing*/
				this.end(0);
			} else {
				this.error(this,"Error: " + (e.number ? e.number : "") + " " + (e.message ? e.message : e));
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

var __browser__;

if(WScript.Arguments.Count() == 0) {
	AGIHandler.verbose("Usage: exten => ext,n,AGI(cscript.exe|//NoLogo|" + WScript.ScriptName + "|VXMLURL[|Voice])");
	AGIHandler.verbose("--  VXMLURL is the full URL of the starting VXML application");
	AGIHandler.verbose("--  Voice is the (Optional) default voice");
} else {
	__browser__ = new JavierBrowser
		(new Javier()
		,new AGIInHandler()
		,new AGIOutHandler((WScript.Arguments.Count() > 1) ? WScript.Arguments.Item(1) : "")
		,new AGIErrHandler()
		,new NetHandler()
		,new LogHandler(WScript.ScriptFullName + ".log")
		);
	/*	
	__browser__.loadCallback = function (readyState) { AGIHandler.verbose("Loading: " + readyState); }
	__browser__.errorCallback = function (description) { AGIHandler.verbose("Error: " + description); }
	__browser__.warningCallback = function (description) { AGIHandler.verbose("Warning: " + description); }
	__browser__.commentCallback = function (description) { AGIHandler.verbose("Comment: " + description); }
	__browser__.describeCallback = function (description) { AGIHandler.verbose("Describe: " + description); }
	__browser__.readyCallback = function (readyState) { AGIHandler.verbose("Ready: " + readyState); }
	*/
	__browser__.urlCallback = function (url) { AGIHandler.verbose("URL change: " + url); }	
	__browser__.endCallback = function (endCode) { WScript.Quit(endCode); }	
	
	//AGIHandler.answer();
	__browser__.document = new __document__(WScript.Arguments.Item(0));
	while(__browser__.document.url != "") {
		__browser__.load(__browser__.document);		
		for(var i = 1; i < 10; i++) {
			WScript.Echo("__browser__.loading " + i);
			WScript.Sleep(100);		
		}
	}
	
		
		
/*		
		if(!AGIHandler.eventLoop()) {
			WScript.Quit(1);			
		}
*/
/*
		AGIHandler.multithread = true;
		for(;;) {
			if(AGIHandler.command != "") {
				__stdout__.write(AGIHandler.command);
				__stdout__.flush()
				AGIHandler.command = "";
				AGIHandler.result = AGIHandler.get_result();
				while(AGIHandler.result) {
					__stdout__.write("NOOP\n");
					AGIHandler.get_result(); /*we don't care about result* /
				}
			} else {
				if(AGIHandler.command == "") {
					__stdout__.write("EXEC WAIT 1\n");
					
					for(var i=0;i<9;i++) {
						__stderr__.write("EXEC WAIT 1: {1}\n", i);
						WScript.Sleep(100);
					}
					
					AGIHandler.get_result(); /*we don't care about result* /
				}
			}
		}
*/

/*	
	try {
		__browser__.load(WScript.Arguments.Item(0));
		
		while(__browser__.document.url != "") {
			WScript.Sleep(1000);
		}
		/*
		if(!AGIHandler.eventLoop()) {
			WScript.Quit(1);			
		}
		* /
	} catch(e) {
	    
		WScript.Quit(1);
	}
	*/
}
