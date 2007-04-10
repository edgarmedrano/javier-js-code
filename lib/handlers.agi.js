/*------------------------------------------------------------------------
  File:        handlers.agi.js
  Description: JAVIER Handlers JScript version + AGI
  Author:      Edgar Medrano Pérez 
               edgarmedrano at gmail dot com
  Created:     2007.04.04
  Company:     JAVIER project
               http://javier.sourceforge.net
  Notes:       You must include agi.js
------------------------------------------------------------------------*/

var AGIHandler = new AGI();

function NetHandler() {
	var xmlhttp;

	try {
		if (XMLHttpRequest) { // Mozilla, Safari,...
			xmlhttp = new XMLHttpRequest();
			if (xmlhttp.overrideMimeType) {
				xmlhttp.overrideMimeType('text/xml');
			}
		}
	} catch(e) {
		if (ActiveXObject) { // IE
			try {
				xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
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

function AGIInHandler() {
	this.getInput = 
		function (text,value) {
			return AGIHandler.get_data("beep",60000);
		}
}

function AGIOutHandler(voiceName) {
	var TTSHandler = false;
	var file_index = 0;
	var TTSFile;
	
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
		
		TTSFile = function (text) {
			var wsh = new ActiveXObject("WScript.Shell");
			var fso = new ActiveXObject("Scripting.FileSystemObject");
			var spfs = new ActiveXObject("Sapi.SpFileStream");
			var fileName;
			var wavPath;
			var gsmPath;
			
			/********************************************************
			Implement caching here
			*********************************************************/
			
			//**/ __stderr__.write("TTSFile: " + text);
			do {
				fileName = "javier" + (++file_index);
				wavPath = "..\\sounds\\" + fileName + ".wav";
				gsmPath = "..\\sounds\\" + fileName + ".gsm";
			} while(fso.FileExists(wavPath) || fso.FileExists(gsmPath));
			
			//**/ __stderr__.write("fileName: " + fileName);
			spfs.Format.Type = 6; // SAFT8kHz8BitMono
			//**/ __stderr__.write("spfs.Format.Type: " + spfs.Format.Type);
			spfs.Open(wavPath, 3 /* SSFMCreateForWrite */, false);
			//**/ __stderr__.write("spfs.Open: " + spfs.Format.Type);

			TTSHandler.AllowAudioOutputFormatChangesOnNextSet = false;
			//**/ __stderr__.write("AllowAudioOutput");
			TTSHandler.AudioOutputStream = spfs;
			//**/ __stderr__.write("AudioOutputStream");
			TTSHandler.Speak(text, 0 /* SVSFDefault */);
			//**/ __stderr__.write("TTSHandler.Speak");
			
			spfs.Close();
			//**/ __stderr__.write("spfs.Close");
			delete spfs;
			//**/ __stderr__.write("delete spfs");
			
			while(!fso.FileExists(wavPath)) {
				WScript.Sleep(100);	
			}
			//**/ __stderr__.write("fso.FileExists");
			
			var oExec = wsh.Exec("sox " + wavPath + " " + gsmPath);
			//**/ __stderr__.write("sox " + wavPath + " " + gsmPath);
			while (oExec.Status == 0) {
				WScript.Sleep(100);
			}
			//**/ __stderr__.write("oExec.Status");
			
			while(!fso.FileExists(gsmPath)) {
				WScript.Sleep(100);	
			}
			//**/ __stderr__.write("fso.FileExists");
			fso.DeleteFile(wavPath);
			//**/ __stderr__.write("fso.DeleteFile");
			
			return fileName;
		}
	} catch(e) {
		this.setVoice = function () { return true; }
		this.getVoices = function () { return { Count: 0 };	}
		TTSFile = function () { return "javier" + (++file_index); }
	}	

	this.addText = function (text) {
		//try {
			//**/ __stderr__.write("addText: " + text);
			var file = TTSFile(text);
			//**/ __stderr__.write("TTSFile: " + file);
			AGIHandler.stream_file(file,"123456789");
			//AGIHandler.appexec("PLAYBACK", file);
			//**/ __stderr__.write("AGIHandler.stream_file");
		//} catch(e) {
			//var __r__ = "";
			//for(var __n__ in e) { __r__ += (__r__ == "" ? "" : ",") + __n__ + ": " + (typeof(e[__n__]) == "string" ? '"' + e[__n__] +  '"' : e[__n__]); }
			//AGIHandler.verbose("Speak error: " + "{" + __r__ + "}");
			//AGIHandler.verbose("Speak error: " + (e.number ? e.number : "") + " " + (e.message ? e.message : e));
			/**************************************
			Implement graceful exit, maybe:
			if(exception instanceOf TTSException) {
				AGIHandler.stream_file("javier.sorry");
				throw(new JavierException("TTS: " + exception.description));
			}
			***************************************/
		//}
	}
	
	this.clearText = function () { }
	
	this.waitUntilDone = function(msTimeout) { }
	
	if(voiceName) {
		this.setVoice(voiceName);
	}
}

function LogHandler(logFile) {
	var f;
	try {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		f = fso.CreateTextFile(logFile,true /*for appending*/);
	} catch(e) {
		// do nothing
	}

	this.writeln = function (text) {
		try {
			f.WriteLine(text);
		} catch(e) {
		  // this error isn't really important		    
		}
	}
}

function AGIErrHandler() {
	this.writeln = function (text) {
		try {
			AGIHandler.verbose(text.replace(/\s/g," ").replace("\"","'"));
		} catch(e) {
		  // there must not be an error when reporting an error  
		}
	}
}
