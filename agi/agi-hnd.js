// CScript implementation
function _getArguments() {
	var result = new Array();
	/*
	for(var i = 0; i < WScript.Arguments.Count(); i ++) {
		result[result.length] = WScript.Arguments.Item(i);
	}
	
	result.unshift(WScript.ScriptFullName)
	*/
	return result;
}

function _StdIn() {
	this.readline = function() {
		return prompt();
	}
}

function _StdOut() {
	this.replace = function (text,args) {
		for (var i = 1; i < args.length; i++) {
			text = text.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
		}
		return text;
	}
	
	this.write = function(text) {
		alert(this.replace(text,arguments));
		//WScript.StdOut.Write(this.replace(text,arguments));
	}
	
	this.writeln = function(text) {
		this.write(this.replace(text,arguments) + "\n")
	}
	
	this.flush = function () {}
}

function _StdErr() {
	this.replace = function (text,args) {
		for (var i = 1; i < args.length; i++) {
			text = text.replace(new RegExp("\\{" + i + "\\}", "g"), args[i]);
		}
		return text;
	}
	
	this.write = function(text) {
		alert(this.replace(text,arguments));
		//return WScript.StdErr.Write(this.replace(text,arguments));
	}
	
	this.writeln = function(text) {
		this.write(this.replace(text,arguments) + "\n")
	}
	
	this.flush = function () {}
}
