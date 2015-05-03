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

if ("speechSynthesis" in window) {
    TTSHandler = {
		GetVoices: function () {
				var voices = [];
				speechSynthesis.getVoices().forEach(function (voice, i) {
						voices[i] = {
								GetDescription: function () {
										return voice.name;
									},
								Value: voice
							};
					});				
				return {
						Count: voices.length,
						Item: function (index) {
								return voices[index];
							}
					};
			},
		Speak: function (text, mode) {
				if(text != "") {
					var msg = new SpeechSynthesisUtterance();
					msg.text = text;
					if ("Voice" in this) {
						msg.voice = this.Voice.Value;
					}
					speechSynthesis.speak(msg);					
				} else {
					if(speechSynthesis.speaking) {
						speechSynthesis.cancel();
					}
				}
			},
		WaitUntilDone: function (mode) {
				
			}
	}
} else {
	if ("ActiveXObject" in window) {
		try {
			TTSHandler = new ActiveXObject("Sapi.SpVoice");
		} catch(exception) {
			alert(exception);
		}
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
		
	this.waitUntilDone = 
		function () {
			if(TTSHandler) {
				try {
					TTSHandler.WaitUntilDone(-1);
				} catch(exception) {
					//alert("Speak error");
				}
			}
		}
}

function JSInOutHandler() {
	this.prompt = "";
	
	this.getInput = 
		function (text,value) {
			if(this.prompt != "") {
				text = this.prompt;
				this.prompt = "";
			}
			if(value) {
				return prompt(text,value);
			}
			return prompt(text);
		}
		
	this.addText = 
		function (text) {
			this.prompt += text + "\n";
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
		
	this.waitUntilDone = 
		function () {
			if(this.prompt != "") {
				alert(this.prompt);
				this.prompt = "";
			}
			if(TTSHandler) {
				try {
					TTSHandler.WaitUntilDone(-1);
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
