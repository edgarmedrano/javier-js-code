/*------------------------------------------------------------------------
  File:        stdio.js
  Description: Standard I/O JavaScript version
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
		this.length = 0;
	}
	
__stdin__ = function () {
	this.readline = function() {
		var text = "";
		
		text = prompt("stdin");
		
		if(text == null) {
			throw(new IOException("EOF reached in stdin"));
		}
		
		return text;
	}
}

__stdout__ = function _stdout() {
	this.replace = function (text,args) {
		for (var i = 1; i < args.length; i++) {
			text = text.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
		}
		return text;
	}
	
	this.write = function(text) {
		if(!confirm(this.replace(text,arguments))) {
			throw(new IOException("Unable to write to stdout"));
		}
	}
	
	this.writeln = function(text) {
		this.write(this.replace(text,arguments) + "\n")
	}
	
	this.flush = function () {}
}

__stderr__ = function () {
	this.replace = function (text,args) {
		for (var i = 1; i < args.length; i++) {
			text = text.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
		}
		return text;
	}
	
	this.write = function(text) {
		if(!confirm(this.replace(text,arguments))) {
			throw(new IOException("Unable to write to stderr"));
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
