/*------------------------------------------------------------------------
  File:        handlers.js
  Description: JAVIER Handlers Web Browser version
  Author:      Edgar Medrano Pérez 
               edgarmedrano at gmail dot com
  Created:     2007.03.26
  Company:     JAVIER project
               http://javier.sourceforge.net
  Notes:       
------------------------------------------------------------------------*/

function NetHandler() {
	var xmlhttp;

	if (XMLHttpRequest) { // Mozilla, Safari,...
		xmlhttp = new XMLHttpRequest();
		if (xmlhttp.overrideMimeType) {
			xmlhttp.overrideMimeType('text/xml');
		}
	} else if (ActiveXObject) { // IE
		try {
			xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e) {
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
	}
	
	this.load = function 
			(__type
			,__url
			,__method
			,__enctype
			,__objRef
			,__processFun
			,__statusFun
			,__timeout
			,__maxage
			,__maxstale) {
		var __url_parts = __url.split("\?");
		__method = __method ? __method : "GET";
		__enctype = __enctype ? __enctype : "";
		__timeout = __timeout ? __timeout : 0;
		
	    if (__url.length >= 2083) {
			__method = "POST";
		}
		
		if(__method == "POST") {
			xmlhttp.open("POST", __url_parts[0], true);
			if(!__enctype) {
				xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			}
		} else {
			xmlhttp.open("GET", __url);		
		}
		
		if(__enctype) {
			xmlhttp.setRequestHeader("Content-Type", __enctype);
		} 
		
		if(!__maxage) {
			xmlhttp.setRequestHeader("Cache-Control","must-revalidate");
	    } else {
			xmlhttp.setRequestHeader("Cache-Control","max-age=" + __maxage);
		}

		if(__maxstale) {
			xmlhttp.setRequestHeader("Cache-Control","max-stale=" + __maxage);		
		}
		
		if(__processFun) {
			if(__timeout > 0) {
				__timeout = setTimeout(function () {
							if (xmlhttp.readyState != 4) {
								xmlhttp.abort();
								__processFun("error.badfetch.timeout",__objRef);
							}
						}
					,__timeout);
			}
			
		    xmlhttp.onreadystatechange = function() { 
				if (xmlhttp.readyState == 4) {    	    	
					if(xmlhttp.status == 200) {
						if(__type == "xml") {
							__processFun(xmlhttp.responseXML,__objRef); 		     
						} else {
							__processFun(xmlhttp.responseText,__objRef); 		     						
						}
					} else {	
						__processFun("error.badfetch.http." + xmlhttp.status,__objRef);
					}
				} else {
					__statusFun(__objRef,xmlhttp.readyState)
				}
		    }   
		}
		
	    if (__url_parts.length > 1) {
		   xmlhttp.send(__url_parts[1]);
	    }else{
	       xmlhttp.send("");
		} 
		
		if(__processFun) {
			return true;
		}

		if(__type == "xml") {
			return xmlhttp.responseXML;
		} 
		
		return xmlhttp.responseText;
	}
	
	this.loadXML = function 
		(__url
		,__method
		,__enctype
		,__objRef
		,__processFun
		,__statusFun
		,__timeout
		,__maxage
		,__maxstale
		) {
		this.load
			("xml"
			,__url
			,__method
			,__enctype
			,__objRef
			,__processFun
			,__statusFun
			,__timeout
			,__maxage
			,__maxstale
			);
	}

	this.loadText = function 
		(__url
		,__method
		,__enctype
		,__objRef
		,__processFun
		,__statusFun
		,__timeout
		,__maxage
		,__maxstale
		) {
		this.load
			("text"
			,__url
			,__method
			,__enctype
			,__objRef
			,__processFun
			,__statusFun
			,__timeout
			,__maxage
			,__maxstale
			);
	}
	
	this.getXML = function () { return xmlhttp.responseXML; }
	this.getText = function () { return xmlhttp.responseText; }
}

function JSInHandler() {
	this.getInput = 
		function (text,value) {
			if(value) {
				return prompt(text,value);
			}
			return prompt(text);
		}
}

function JSOutHandler(voiceName) {
	var TTSHandler = false;
	
	try {
		TTSHandler = new ActiveXObject("Sapi.SpVoice");
		this.setVoice = function (voiceName) {
			var TTSVoices = TTSHandler.GetVoices();
			
			for(var i=0; i < TTSVoices.Count; i++) {
				if(TTSVoices.Item(i).GetDescription().indexOf(voiceName) >= 0) {
					TTSHandler.Voice = TTSVoices.Item(i);
					return true;
				}
			}
			
			return false;
		}
		
		this.getVoices = function () {
			return TTSHandler.GetVoices();
		}
	} catch(e) {
		this.setVoice = function () { return true; }
		this.getVoices = function () { return { Count: 0 };	}
	}	
	
	this.addText = function (text) {
		document.frmOut.txtOut.value += text + "\n";
		if(TTSHandler) {
			try {
				TTSHandler.Speak( text, 1 );
			} catch(exception) {
				alert("Speak error");
			}
		}
	}
	
	this.clearText = function () {
		document.frmOut.txtOut.value = "";
		if(TTSHandler) {
			try {
				TTSHandler.Speak("", 2);
			} catch(exception) {
				//alert("Speak error");
			}
		}
	}
	
	this.waitUntilDone = function(msTimeout) {
		msTimeout = msTimeout ? msTimeout : -1;
		if(TTSHandler) {
			try {
				TTSHandler.WaitUntilDone(msTimeout);
			} catch(exception) {
				//WScript.Echo("Speak error");
			}
		}	
	}
	
	if(voiceName) {
		this.setVoice(voiceName);
	}	
}

function LogHandler() {
	this.writeln = function (text) {
		document.frmLog.txtLog.value += text + "\n";
	}
}

function ErrHandler() {
	this.writeln = function (text) {
		alert(text);
	}
}
