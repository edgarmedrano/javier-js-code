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
			/*
			if(__timeout > 0) {
				__timeout = setTimeout(function () {
							if (xmlhttp.readyState != 4) {
								xmlhttp.abort();
								__processFun.apply(__objRef,"error.badfetch.timeout");
							}
						}
					,__timeout);
			}
			*/
			
		    xmlhttp.onreadystatechange = function() { 
				if (xmlhttp.readyState == 4) {    	    	
					if(xmlhttp.status == 200) {
						//clearTimeout(__timeout);
						if(__type == "xml") {
							__processFun.call(__objRef,xmlhttp.responseXML); 		     
						} else {
							__processFun.call(__objRef,xmlhttp.responseText); 		     						
						}
					} else {	
						__processFun.call(__objRef,"error.badfetch.http." + xmlhttp.status);
					}
				} else {
					__statusFun.call(__objRef,xmlhttp.readyState)
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
			
			do {
				fileName = "javier" + (++file_index);
				wavPath = "" + fileName + ".wav";
				gsmPath = "..\\sounds\\" + fileName + ".gsm";
			} while(fso.FileExists(wavPath) || fso.FileExists(gsmPath));
			
			spfs.Format.Type = 6; // SAFT8kHz8BitMono
			spfs.Open(wavPath, 3 /* SSFMCreateForWrite */, false);

			TTSHandler.AllowAudioOutputFormatChangesOnNextSet = false;
			TTSHandler.AudioOutputStream = spfs;
			TTSHandler.Speak(text, 0 /* SVSFDefault */);
			
			spfs.Close();
			delete spfs;
			
			while(!fso.FileExists(wavPath)) {
				WScript.Sleep(1);	
			}
			
			var oExec = wsh.Exec("sox " + wavPath + " " + gsmPath);
			while (oExec.Status == 0) {
				WScript.Sleep(1);	
			}
			
			while(!fso.FileExists(gsmPath)) {
				WScript.Sleep(1);	
			}
			
			//fso.DeleteFile(wavPath);
			
			return fileName;
		}
	} catch(e) {
		this.setVoice = function () { return true; }
		this.getVoices = function () { return { Count: 0 };	}
		TTSFile = function () { return "javier" + (++file_index); }
	}	

	this.addText = function (text) {
		var file = "beeperr";
		/**************************************
		Implement graceful exit, maybe:
		if(exception instanceOf TTSException) {
			AGIHandler.stream_file("javier.sorry");
			throw(new JavierException("TTS: " + exception.description));
		}
		***************************************/
		try {
			file = TTSFile(text);
		} catch(e) {
			throw({number: (e.number ? e.number : ""), message: "Speak error:" + (e.message ? e.message : e)})
		}
		try {
			//**/ __stderr__.write("addText: " + file);
			//AGIHandler.stream_file(file);
			AGIHandler.appexec("PLAYBACK", file);
			//**/ __stderr__.write("AGIHandler.stream_file");
		} catch(e) {
		    
		    var r = "";
			for(var n in e) {
				r += "," + n + ":" + e[n];
			}
			
			throw({number: (e.number ? e.number : ""), message: "AGI Speak error:" + r})
		}
	}
	
	this.clearText = function () { }
	
	this.waitUntilDone = function(msTimeout) { }
	
	if(voiceName) {
		this.setVoice(voiceName);
	}
}

function LogHandler(logFile) {
	this.fso = new ActiveXObject("Scripting.FileSystemObject");
	this.logFile = logFile;

	this.writeln = function (text) {
		try {
			var f = this.fso.CreateTextFile(this.logFile,true /*for appending*/);
			f.WriteLine(text);
			f.Close();
		} catch(write_error) {
		    
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
