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

var TTSHandler = false;

if (window.ActiveXObject) {
	try {
		TTSHandler = new ActiveXObject("Sapi.SpVoice");
	} catch(exception) {
		alert(exception);
	}
}

function setVoice(voiceName) {
	if(TTSHandler) {
		var TTSVoices = TTSHandler.GetVoices();
		
		for(var i=0; i < TTSVoices.Count; i++) {
			if(TTSVoices.Item(i).GetDescription().indexOf(voiceName) >= 0) {
				TTSHandler.Voice = TTSVoices.Item(i);
				return true;
			}
		}
	} else {
		return true;
	}
	
	return false;
}

function NetHandler() {
	this.status = false;
	this.lastError = "";
	
	this.load = NetHandler_load;
	this.getXML = NetHandler_getXML;
	this.getText = NetHandler_getText;
	this.getXMLHttp = NetHandler_getXMLHttp;
	this.xmlhttp = this.getXMLHttp();
}

function NetHandler_getXMLHttp() {
	var xmlhttp = false;
	
	if (window.XMLHttpRequest) { // Mozilla, Safari,...
		xmlhttp = new XMLHttpRequest();
		if (xmlhttp.overrideMimeType) {
			xmlhttp.overrideMimeType('text/xml');
		}
	} else if (window.ActiveXObject) { // IE
		try {
			xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e) {
			try {
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			} catch (e) {}
		}
	}
	
	if (!xmlhttp) {
		this.lastError = "Unable to create XMLHTTP object";
		return false;
	}
	
	return xmlhttp;
}

function NetHandler_load(_url) {
    var xmlhttp = this.xmlhttp;
	this.status = false;
	
	if(xmlhttp) {
		xmlhttp.open('GET', _url, false);
		xmlhttp.send(null);
	    
		if(xmlhttp.status == 200) {
			this.status = true;
			this.lastError = "";
		} else {
			throw("error.badfetch.http." + xmlhttp.status)
		}
	}
	
	return this.status;
}

function NetHandler_getXML() {
	if(this.status) {
		return this.xmlhttp.responseXML;
	}
	return null;
}

function NetHandler_getText() {
	if(this.status) {
		return this.xmlhttp.responseText;	
	}
	return "";
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

function JSOutHandler() {
	this.addText = 
		function (text) {
			document.frmOut.txtOut.value += text + "\n";
			if(TTSHandler) {
				try {
					TTSHandler.Speak( text, 1 );
				} catch(exception) {
					alert("Speak error");
				}
			}
		}
	this.clearText = 
		function () {
			document.frmOut.txtOut.value = "";
			if(TTSHandler) {
				try {
					TTSHandler.Speak("", 2);
				} catch(exception) {
					//alert("Speak error");
				}
			}
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
