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

__argv__ = function () {
		this.length = WScript.Arguments.Count() + 1;
		this[0] = WScript.ScriptFullName;
		
		for(var i = 0; i < WScript.Arguments.Count(); i ++) {
			this[i + 1] = WScript.Arguments.Item(i);
		}
	}
	
__stdin__ = function () {
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var f = fso.CreateTextFile("stdin.log",true /*for appending*/);
	
	this.readline = function() {
		var text = WScript.StdIn.ReadLine();
		f.WriteLine(text);

		return text;
		//return WScript.StdIn.ReadLine();
	}
}

__stdout__ = function _stdout() {
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var f = fso.CreateTextFile("stdout.log",true /*for appending*/);
	
	this.replace = function (text,args) {
		for (var i = 1; i < args.length; i++) {
			text = text.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
		}
		
		return text;
	}
	
	this.write = function(text) {
		text = this.replace(text,arguments);
		f.WriteLine(text);
		WScript.StdOut.Write(text);
	}
	
	this.writeln = function(text) {
		this.write(this.replace(text,arguments) + "\n")
	}
	
	this.flush = function () {}
}

__stderr__ = function () {
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var f = fso.CreateTextFile("stderr.log",true /*for appending*/);
	
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
		/*
		try {
			WScript.StdErr.Write(text);
		} catch(e) {
			// do nothing
		}*/
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
