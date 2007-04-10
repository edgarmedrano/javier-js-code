/*------------------------------------------------------------------------
  File:        stdio.wsh.js
  Description: Standard I/O JScript version
  Author:      Edgar Medrano Pérez 
               edgarmedrano at gmail dot com
  Created:     2007.04.06
  Company:     JAVIER project
               http://javier.sourceforge.net
  Notes:       
------------------------------------------------------------------------*/

function Exception(message) {
	this.name = ("" + this.constructor).match(/\s*function\s+(\w*)/);
		
	if(this.name && this.name.length < 2) {
		this.name = "Anonymous";
	} else {
		this.name = this.name[1];
	}

	this.message = message;
}

function IOException(message) { Exception.call(this,message); }
	
__argv__ = function () {
		this.length = WScript.Arguments.Count() + 1;
		this[0] = WScript.ScriptFullName;
		
		for(var i = 0; i < WScript.Arguments.Count(); i ++) {
			this[i + 1] = WScript.Arguments.Item(i);
		}
	}
	
__stdin__ = function () {
	var f;
	try {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		f = fso.CreateTextFile("stdin.log",true /*for appending*/);
	} catch(e) {
		// do nothing
	}
	
	this.readline = function() {
		var text = "";
		
		while(!WScript.StdIn.AtEndOfLine) {
			if(WScript.StdIn.AtEndOfStream) {
				break;
			}
		
			try {
				text += WScript.StdIn.Read(1);
			} catch(e) {
				throw(new IOException("Unable to read from stdin"));
			}
			
			WScript.Sleep(1);
		}
		
		try {
			f.WriteLine(text);
		} catch(e) {
			// do nothing
		}
		
		if(WScript.StdIn.AtEndOfStream) {
			throw(new IOException("EOF reached in stdin"));
		}
				
		return text;
	}
}

__stdout__ = function _stdout() {
	var f;
	try {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		f = fso.CreateTextFile("stdout.log",true /*for appending*/);
	} catch(e) {
		// do nothing
	}
	
	this.replace = function (text,args) {
		for (var i = 1; i < args.length; i++) {
			text = text.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
		}
		
		return text;
	}
	
	this.write = function(text) {
		text = this.replace(text,arguments);
		
		try {
			f.WriteLine(text);
		} catch(e) {
			// do nothing
		}
		
		try {
			WScript.Sleep(1000);
			for(var i = 0; i < text.length; i++) {
				WScript.StdOut.Write(text.charAt(i));
				WScript.Sleep(1);
			}
		} catch(e) {
			throw(new IOException("Unable to write to stdout"));
		}
	}
	
	this.writeln = function(text) {
		this.write(this.replace(text,arguments) + "\n")
	}
	
	this.flush = function () {}
}

__stderr__ = function () {
	var f;
	try {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		f = fso.CreateTextFile("stderr.log",true /*for appending*/);
	} catch(e) {
		// do nothing
	}
	
	this.replace = function (text,args) {
		for (var i = 1; i < args.length; i++) {
			text = text.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
		}
		return text;
	}
	
	this.write = function(text) {
		text = this.replace(text,arguments);
		
		try {
			f.WriteLine(text);
		} catch(e) {
			// do nothing
		}
		
		try {
			WScript.Sleep(1000);
			for(var i = 0; i < text.length; i++) {
				WScript.StdErr.Write(text.charAt(i));
				WScript.Sleep(1);
			}
		} catch(e) {
			throw(new IOException("Unable to write to stdout"));
		}
	}
	
	this.writeln = function(text) {
		this.write(this.replace(text,arguments) + "\n")
	}
	
	this.flush = function () {}
}

__argv__ = new __argv__();
__stdin__ = new __stdin__();
__stdout__ = new __stdout__();
__stderr__ = new __stderr__();
