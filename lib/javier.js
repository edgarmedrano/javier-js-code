/*------------------------------------------------------------------------
  File:        javier.js
  Description: JAvascript Voicexml InterpretER
  Author:      Edgar Medrano Pérez 
               edgarmedrano at gmail dot com
  Created:     2007.03.26
  Company:     JAVIER project
               http://javier.sourceforge.net
  Notes:       
------------------------------------------------------------------------*/

/** 
 * @fileoverview This is a JavaScript VoiceXML Interpreter Engine
 * <p>It depends on handlers.js file to work properly.</p>
 * <p>This file is part of the 
 * {@link http://javier.sourceforge.net/ JAVIER project}.</p>
 * @author Edgar Medrano Pérez edgarmedrano at gmail dot com
 * @version 1.0 
 */
 
function __trim(trimString) {
	return trimString.replace(/^\s+|\s+$/g,"");
}

function __startTag(node) {
	var result = "/* <" + node.nodeName;
	
	if(node.attributes) {
		for(j=0; j < node.attributes.length; j++) {
			result += " " + node.attributes[j].name + "=\"" + node.attributes[j].value + "\"";
		}
	}
	if(node.childNodes.length == 0) {
		result += " /";
	}
	result += "> */";
	
	return result;
}

function __endTag(node) {
	if(node.childNodes.length == 0) {
		return "";
	}
	
	return "/* </" + node.nodeName + "> */";
}

/**
 * Builds the code from the loaded VXML.
 * @param {Object} xml XML document containing the VXML.
 * @constructor
 */
function VXMLInterpreter(_in,_out,_net,_log,_err) {
	this._in = _in;
	this._out = _out;
	this._net = _net;
	this._log = _log;
	this._err = _err;
	this.load = VXMLInterpreter_load;
	this.run = VXMLInterpreter_run;
	this.parse = VXMLInterpreter_parse;
	this.xml = null;
	this.text = "";
	this.js = "";
	this.logLevel = 4; /* 0 to 4 = none to verbose */
	this.autoEval = true;
	this.getInput = function(text) {
			var result = this._in.getInput(text);
			this._out.clearText();
			return result;
		}
	this.addText = function(text) {
			this._out.addText(text);
		}
	this.clearText = function() {
			this._out.clearText();
		}
	this.log = function(source, text, level) {
		    if(level <= this.logLevel) {
				this._log.writeln(source + ": " + text);
			}
		}
	this.error = function(source, text) {
			this.log(source,text,1);
			_err.writeln(source + ": " + text);
		}
	this.warning = function(source, text) {
			this.log(source,text,2);
		}
	this.comment = function(source, text) {
			this.log(source,text,3);
		}
	this.describe = function(source, text) {
			this.log(source,text,4);
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

function VXMLInterpreter_load(_url) {
	if(this._net.load(_url)) {
	   this.xml = this._net.getXML();
	   this.text = this._net.getText();
	   this.js = this.parse(this.xml,0);
	   return true;
	}
	
	this.error(this._net, this._net.lastError);
	
	return false;
}

function VXMLInterpreter_run(nexturl) {
   var _document;
   
   this._out.clearText();
   while(__trim("" + nexturl) != "") {
		try {
			this.load(nexturl);
		} catch(load_error) {
			this.error(this, load_error + " while loading: " + nexturl);
			break;
		}
		
		if(this.js != "" && this.autoEval) {
			try {
				_document = new Function("_int",this.js); 
				nexturl = _document(this);
			} catch(exec_error) {
				if(exec_error == "error"
					|| exec_error == "exit"
					|| exec_error == "telephone.disconnect") {
					/*Do nothing*/
				} else {
					this.error(this, exec_error);
				}
				break;
			}
		} else {
			break;
		}
   }
   this._out.waitUntilDone();
}

function VXMLInterpreter_parse(node,level) {
    var result = "";
	var child;
	var list;
	var snst = "\n";
	
	for(var i = 0; i < level; i++) {
		snst += "\t";
	}
	
	for(var i = 0; i < node.childNodes.length;i++) {
	    child = node.childNodes[i];
		
		switch(child.nodeName) {
			case "#text":
				if(__trim(child.nodeValue) != "") {
					result += snst + "/* " + __trim(child.nodeValue).replace(/\n/g,snst + "   ") + " */";
				}
				break;
			/*the following tags won't be parsed here*/	
			case "#comment": 
			case "catch":
			case "choice":
			case "error":
			case "filled":
			case "help":
			case "noinput":
			case "nomatch":
			    continue;
			default:
				result += snst + __startTag(child).replace(/\n/g,snst + "   ");
		}
		
		switch(child.nodeName) {
			case "#comment":
				break;
			case "#text":
			    if(__trim(child.nodeValue) != "") {
					result += snst + "_int.addText(unescape(\"" + escape(__trim(child.nodeValue)) + "\"));";
				}
				break;
			case "assign":
				result += snst + "" + child.getAttribute("name");
				if(child.getAttribute("expr")) {
					result += " = " + child.getAttribute("expr").replace(/\n/g,snst + "\t");
				}
				result += ";";
				break;
			case "block":
				if(child.getAttribute("name")) {
					result += snst + "case \"" + child.getAttribute("name") + "\":";
				}
				
				if(child.getAttribute("cond")) {
					result += snst + "\tif(" + child.getAttribute("cond").replace(/\n/g,snst + "\t") + ") {";
					result += this.parse(child,level + 2);
					result += snst + "\t}";
				} else {
					result += this.parse(child,level + 1);
				}
				
				break;
			case "clear":
			    if(child.getAttribute("namelist")) { 
					result += snst + "_clear(\"" + child.getAttribute("namelist") + "\");";
				} else {
					result += snst + "_clear(this.fields);";
				}
				break;
			case "disconnect":
				result += snst + "_form[_form.length] = function() { throw(\"telephone.disconnect\"); } ";
				break;
			case "else":
				result += snst + "} else {";
				break;
			case "elseif":
				result += snst + "} else if(" + child.getAttribute("cond").replace(/\n/g,snst + "\t") + ") {";
				break;
			case "exit":
				if(child.getAttribute("expr")) {
					result += snst + "returnValue = " + child.getAttribute("expr").replace(/\n/g,snst + "\t") + ";";
				}
				result += snst + "return \"#_int_exit\";";
				break;
			case "field":
				result += snst + "case \"" + child.getAttribute("name") + "\":";
				result += snst + "\ttry {";
				result += snst + "\t\tthis." + child.getAttribute("name") + "_count = (!this." + child.getAttribute("name") + "_count? 0 : this." + child.getAttribute("name") + "_count) + 1;";
				result += snst + "\t\t_count = this." + child.getAttribute("name") + "_count;";
				result += this.parse(child,level + 2);
				result += snst + "\t\tfilled = "  
					+ "_int.getInput(\"" + child.getAttribute("name") + "\"," + child.getAttribute("name") + ");" ;
				result += snst + "\t\tif(filled) {";
				result += snst + "\t\t\t" + child.getAttribute("name") + " = filled;";
				result += snst + "\t\t\tthrow(\"filled\");";
				result += snst + "\t\t} else {";
				result += snst + "\t\t\tthrow(\"noinput\");";
				result += snst + "\t\t}";
				result += snst + "\t} catch(_error1) {";
				result += snst + "\t\tvar _throw = false;";
				result += snst + "\t\tvar _break = true;";
				result += snst + "\t\twhile(_error1) {";
				result += snst + "\t\t\ttry {";
				
				for(var j=0; j < child.childNodes.length; j++) {
					if(child.childNodes[j].nodeName == "catch" 
						|| child.childNodes[j].nodeName == "filled" 
						|| child.childNodes[j].nodeName == "error" 
						|| child.childNodes[j].nodeName == "noinput" 
						|| child.childNodes[j].nodeName == "nomatch" 
						|| child.childNodes[j].nodeName == "help" ) {
						var eventName = child.childNodes[j].nodeName;
						
						if(eventName == "catch") {
							eventName = child.childNodes[j].getAttribute("event");
						}
					   
						result += snst + "\t\t\t\t" + __startTag(child.childNodes[j]);
						result += snst + "\t\t\t\tif(_error1 == \"" + eventName + "\"";
						if(child.childNodes[j].getAttribute("cond")) {
							result += snst + " && (" + child.childNodes[j].getAttribute("cond").replace(/\n/g,snst + "\t") + ")";
						}	
						if(child.childNodes[j].getAttribute("count")) {
							result += snst + " && _count == " + child.childNodes[j].getAttribute("count");
						}	
						result += ") {";
						result += this.parse(child.childNodes[j],level + 5);
						result += snst + "\t\t\t\t\t_break = false; break;";
						result += snst + "\t\t\t\t}";
						result += snst + "\t\t\t\t" + __endTag(child.childNodes[j]);
						result += snst + "\t\t\t\telse";
					}
				}
				
				result += snst + "\t\t\t\tif(_error1 == \"filled\"";
				result += snst + "\t\t\t\t\t|| _error1 == \"cancel\") {"; 
				result += snst + "\t\t\t\t\t/*This is the default implementation, do nothing*/";
				result += snst + "\t\t\t\t\t_break = false; break;";
				result += snst + "\t\t\t\t} else if(_error1 == \"help\"";
				result += snst + "\t\t\t\t\t|| _error1 == \"noinput\"";
				result += snst + "\t\t\t\t\t|| _error1 == \"nomatch\"";
				result += snst + "\t\t\t\t\t|| _error1 == \"maxspeechtimeout\") {";
				result += snst + "\t\t\t\t\t_nextitem=\"" + child.getAttribute("name") + "\"; break;";
				result += snst + "\t\t\t\t} else {";
				result += snst + "\t\t\t\t\t_throw = true; break;";
				result += snst + "\t\t\t\t}";
				result += snst + "\t\t\t} catch(_error2) {";
				result += snst + "\t\t\t\t_error1 = _error2;";
				result += snst + "\t\t\t}";
				result += snst + "\t\t}";
				result += snst + "\t\tif(_throw) { throw(_error1); }";
				result += snst + "\t\tif(_break) { break; }";
				result += snst + "\t}";
				break;
			case "form":
			case "menu": // Menu is equivalent to form don't move this code
				result += snst + "_form[_form.length] = ";
				if(child.getAttribute("id")) {
					result += "_form[\"" + child.getAttribute("id") + "\"] = ";
				}
				result += snst + "\tfunction() {";
				var fields = "";
				for(var j=0; j < child.childNodes.length; j++) {
					if(child.childNodes[j].nodeName == "field") {
						result += snst + "\t\tvar " + child.childNodes[j].getAttribute("name");
						if(child.childNodes[j].getAttribute("expr")) {
							result += " = " + child.childNodes[j].getAttribute("expr").replace(/\n/g,snst + "\t");
						}
						result += ";";
						fields += " " + child.childNodes[j].getAttribute("name");
					}
				}
				result += snst + "\t\tthis.fields = \"" + __trim(fields) + "\";";
				result += snst + "\t\tfunction _clear (_namelist) {";
				result += snst + "\t\t\t_namelist = _namelist.split(\" \");";
				result += snst + "\t\t\tfor(var _i=0; _i < _namelist.length; _i++) {";
				for(var j=0; j < child.childNodes.length; j++) {
					if(child.childNodes[j].nodeName == "field") {
						//result += snst + "\t\t   alert(\"" + child.childNodes[j].getAttribute("name") + ":\" + " + child.childNodes[j].getAttribute("name") + ");";
						result += snst + "\t\t\t\tif(_namelist[_i] == \"" + child.childNodes[j].getAttribute("name") + "\") ";
						result += child.childNodes[j].getAttribute("name") + " = ";
						if(child.childNodes[j].getAttribute("expr")) {
							result += child.childNodes[j].getAttribute("expr").replace(/\n/g,snst + "\t");
						} else {
							result += "\"\"";
						}
						result += ";";
						//result += snst + "\t\t   alert(\"" + child.childNodes[j].getAttribute("name") + ":\" + " + child.childNodes[j].getAttribute("name") + ");";
					}
				}
				result += snst + "\t\t\t}";
				result += snst + "\t\t}";
				
				result += snst + "\t\tfunction _get(_field) { return eval(_field); }";
				result += snst + "\t\t_clear(this.fields);";
				result += snst + "\t\tvar _nextitem = true;";
				result += snst + "\t\tthis.count = (!this.count? 0 : this.count) + 1;";
				result += snst + "\t\tvar _count;";
				result += snst + "\t\twhile(_nextitem != false) {";
				result += snst + "\t\t\ttry {";
				result += snst + "\t\t\t\t_count = this.count;";
				result += snst + "\t\t\t\tswitch(_nextitem) {";
				result += snst + "\t\t\t\t\tcase true: ";
				result += this.parse(child,level + 5);
				
				if(child.nodeName == "menu") {
					result += snst + "\t\t\t\t\t\tfilled = _int.getInput(\"type your choice\",\"\");";
					result += snst + "\t\t\t\t\t\tif(filled) {";
					result += snst + "\t\t\t\t\t\t\tswitch(filled) { ";
					for(var j=0; j < child.childNodes.length; j++) {
						if(child.childNodes[j].nodeName == "choice") {
							result += snst + "\t\t\t\t\t\t\t\tcase ";
							if(child.childNodes[j].getAttribute("dtmf")) {
								result += "\"" + child.childNodes[j].getAttribute("dtmf") + "\"";
							}
							if(child.childNodes[j].getAttribute("next")) {
								result += ": return \"" + child.childNodes[j].getAttribute("next") + "\";";
							}
							if(child.childNodes[j].getAttribute("expr")) {
								result += ": return " + child.childNodes[j].getAttribute("expr").replace(/\n/g,snst + "\t") + ";";
							}
						}
					}
					result += snst + "\t\t\t\t\t\t\t\tdefault:";
					result += snst + "\t\t\t\t\t\t\t\t\tthrow(\"nomatch\");";
					result += snst + "\t\t\t\t\t\t\t}";
					result += snst + "\t\t\t\t\t\t} else {";
					result += snst + "\t\t\t\t\t\t\tthrow(\"noinput\");";
					result += snst + "\t\t\t\t\t\t}";
				}
				
				result += snst + "\t\t\t\t\t\t_nextitem = false;";
				result += snst + "\t\t\t\t\t\tbreak;";
				result += snst + "\t\t\t\t\tdefault:";
				result += snst + "\t\t\t\t\t\tthrow(\"Unknown item '\" + _nextitem + \"'\");";
				result += snst + "\t\t\t\t}";
				result += snst + "\t\t\t} catch(_error1) {";
				result += snst + "\t\t\t\tvar _throw = false;";
				result += snst + "\t\t\t\tvar _break = true;";
				result += snst + "\t\t\t\twhile(_error1) {";
				result += snst + "\t\t\t\t\ttry {";
				
				for(var j=0; j < child.childNodes.length; j++) {
					if(child.childNodes[j].nodeName == "catch" 
						|| child.childNodes[j].nodeName == "filled" 
						|| child.childNodes[j].nodeName == "error" 
						|| child.childNodes[j].nodeName == "noinput" 
						|| child.childNodes[j].nodeName == "nomatch" 
						|| child.childNodes[j].nodeName == "help" ) {
						var eventName = child.childNodes[j].nodeName;
						
						if(eventName == "catch") {
							eventName = child.childNodes[j].getAttribute("event");
						}
					   
						result += snst + "\t\t\t\t\t\t" + __startTag(child.childNodes[j]);
						result += snst + "\t\t\t\t\t\tif(_error1 == \"" + eventName + "\"";
						if(child.childNodes[j].getAttribute("cond")) {
							result += snst + " && (" + child.childNodes[j].getAttribute("cond").replace(/\n/g,snst + "\t") + ")";
						}	
						if(child.childNodes[j].getAttribute("count")) {
							result += snst + " && this.count == " + child.childNodes[j].getAttribute("count");
						}	
						result += ") {";
						result += this.parse(child.childNodes[j],level + 7);
						result += snst + "\t\t\t\t\t\t\t_break = false; break;";
						result += snst + "\t\t\t\t\t\t}";
						result += snst + "\t\t\t\t\t\t" + __endTag(child.childNodes[j]);
						result += snst + "\t\t\t\t\t\telse";
					}
				}
				result += snst + "\t\t\t\t\t\tif(_error1 == \"filled\"";
				result += snst + "\t\t\t\t\t\t\t|| _error1 == \"cancel\") {"; 
				result += snst + "\t\t\t\t\t\t\t/*This is the default implementation, do nothing*/";
				result += snst + "\t\t\t\t\t\t\t_break = false; break;";
				result += snst + "\t\t\t\t\t\t} else if(_error1 == \"help\"";
				result += snst + "\t\t\t\t\t\t\t|| _error1 == \"noinput\"";
				result += snst + "\t\t\t\t\t\t\t|| _error1 == \"nomatch\"";
				result += snst + "\t\t\t\t\t\t\t|| _error1 == \"maxspeechtimeout\") {";
				result += snst + "\t\t\t\t\t\t\t_nextitem=true; break;";
				result += snst + "\t\t\t\t\t\t} else {";
				result += snst + "\t\t\t\t\t\t\t_throw = true; break;";
				result += snst + "\t\t\t\t\t\t}";
				result += snst + "\t\t\t\t\t} catch(_error2) {";
				result += snst + "\t\t\t\t\t\t_error1 = _error2;";
				result += snst + "\t\t\t\t\t}";
				result += snst + "\t\t\t\t}";
				result += snst + "\t\t\t\tif(_throw) { throw(_error1); }";
				result += snst + "\t\t\t\tif(_break) { break; }";
				result += snst + "\t\t\t}";
				result += snst + "\t\t}";
				result += snst + "\t\treturn \"\";";
				result += snst + "\t}";
				break;
			case "goto":
				if(child.getAttribute("next")) {
					result += snst + "return \"" + child.getAttribute("next") + "\";";
				} else if (child.getAttribute("expr")) {
				    /************************************************************
					IT MUST BE:
					result += snst + "return " + child.getAttribute("expr").replace(/\n/g,snst + "\t") + ";";
					BUT I HAVE TO DO THIS WORKAROUND:
					*************************************************************/
					if(child.getAttribute("expr").indexOf("#") >= 0
					  || child.getAttribute("expr").indexOf("//") >= 0) {
						result += snst + "return \"" + child.getAttribute("expr") + "\";";
					} else {
						result += snst + "return " + child.getAttribute("expr").replace(/\n/g,snst + "\t") + ";";
					}
				} else if (child.getAttribute("_nextitem")) {
					result += snst + "_nextitem = \"" + child.getAttribute("_nextitem") + "\"; break;";
				} else if (child.getAttribute("expritem")) {
					result += snst + "_nextitem = " + child.getAttribute("expritem").replace(/\n/g,snst + "\t") + "; break;";
				}
				break;
				
			case "grammar":
				//*************************************************************
				//* Falta esta implementacion
				//*************************************************************
				this.warning(this,"Unsupported element: grammar");
				break;
			case "if":
				result += snst + "if(" + child.getAttribute("cond").replace(/\n/g,snst + "\t") + ") {";
				result += this.parse(child, level + 1);
				result += snst + "}";
				break;
			case "meta":
				//result += snst + "this." + child.getAttribute("name") + " = \"" + child.getAttribute("value").replace(/\n/g,snst + "\t") + "\";";
				break;				
			case "prompt":
				if(child.getAttribute("timeout")) {
					this.warning(this,"Unsupported attribute: timeout");
				}
				if(child.getAttribute("cond")) {
					result += snst + "if(" + child.getAttribute("cond").replace(/\n/g,snst + "\t") + ") {";
				}	
				if(child.getAttribute("count")) {
					result += snst + "if(_count == " + child.getAttribute("count") + ") {";
				}
				result += this.parse(child, level + 1);
				if(child.getAttribute("count")) {
					result += snst + "}";
				}
				if(child.getAttribute("cond")) {
					result += snst + "}";
				}
				break;
			case "property":
				//result += snst + "_int.setProperty(\"" + child.getAttribute("name") + "\",\"" + child.getAttribute("value").replace(/\n/g,snst + "\t") + "\");";
				break;
			case "script":
				if(child.firstChild) {
				   result += snst + "" + child.firstChild.nodeValue;
				}
				break;
			case "submit":
				if (child.getAttribute("expr")) {
					result += snst + "__expr = " + child.getAttribute("expr").replace(/\n/g,snst + "\t") + ";";
				}
				
				result += snst + "return _int.getQuery(_get";
				
				if (child.getAttribute("expr")) {
					result += ",__expr";
				} else if (child.getAttribute("next")) {
					result += ",\"" + child.getAttribute("next") + "\"";
				} else {
					result += ",\"\"";
				}
				
			    if(child.getAttribute("namelist")) { 
					result += ",\"" + child.getAttribute("namelist") + "\"";
				} else {
					result += ",this.fields";
				}
				
				/*
			    if(child.getAttribute("method")) { 
					result += ",\"" + child.getAttribute("method") + "\"";
				} else {
					result += ",\"\"";
				}
				*/
				if(child.getAttribute("method")) {
					this.warning(this,"Unsupported attribute: method");
				}

				/*
			    if(child.getAttribute("enctype")) { 
					result += ",\"" + child.getAttribute("enctype") + "\"";
				} else {
					result += ",\"\"";
				}
				*/
				if(child.getAttribute("enctype")) {
					this.warning(this,"Unsupported attribute: enctype");
				}
				
				result += ");";
				break;
			case "throw":
				result += snst + "throw(\"" + child.getAttribute("event") + "\");";
				break;
			case "value":
				if(child.getAttribute("class")) {
					this.warning(this,"Unsupported attribute: class");
				}
				if(child.getAttribute("mode")) {
					this.warning(this,"Unsupported attribute: mode");
				}
				if(child.getAttribute("recSrc")) {
					this.warning(this,"Unsupported attribute: recSrc");
				}
				if(child.getAttribute("expr")) {
					result += snst + "__expr = " + child.getAttribute("expr").replace(/\n/g,snst + "\t") + ";";
					result += snst + "_int.addText(__expr);";
				}
				break;
			case "var":
				result += snst + "var " + child.getAttribute("name");
				if(child.getAttribute("expr")) {
					result += " = " + child.getAttribute("expr").replace(/\n/g,snst + "\t");
				}
				result += ";";
				break;
			case "vxml":
				result += snst + "var _next = 0;";
				result += snst + "var _form = new Array();";
				result += this.parse(child, level + 1);
				result += snst + "_form[_form.length] = _form._int_exit = function() { return \"\"; }";
				result += snst + "\twhile(_form[_next] && \"\" + _next != \"\") { ";
				result += snst + "\t\tvar _newnext = _form[_next]();";
				result += snst + "\t\tif(_newnext == \"\") {";
				result += snst + "\t\t\tfor(_newnext = 0; _newnext < _form.length; _newnext++) {";
				result += snst + "\t\t\t\tif(_form[_next] == _form[_newnext]) {";
				result += snst + "\t\t\t\t\t_newnext = _newnext + 1;";
				result += snst + "\t\t\t\t\tbreak;";
				result += snst + "\t\t\t\t}";
				result += snst + "\t\t\t}";
				result += snst + "\t\t\tif(_newnext == _form.length) {";
				result += snst + "\t\t\t\t_newnext = \"\";";
				result += snst + "\t\t\t}";
				result += snst + "\t\t}";
				result += snst + "\t\t_next = _newnext;";
				result += snst + "\t\tif(typeof(_next) == \"string\") {";
				result += snst + "\t\t\tif(_next.indexOf(\"#\") >= 0) {";
				result += snst + "\t\t\t\t_newnext = _next.split(\"#\");";
				result += snst + "\t\t\t\tif(_newnext[0] == \"\" || _newnext[0] == _url) {";
				result += snst + "\t\t\t\t\t_next = _newnext[1];";
				result += snst + "\t\t\t\t}";
				result += snst + "\t\t\t} ";
				result += snst + "\t\t}";
				result += snst + "\t}";
				result += snst + "\treturn _next;";
				break;
			case "xml": /*this is a workaround for IE, don't move*/
				break;
			default:
			    throw("error.unsupported." + child.nodeName);
				break;
		}
		
		if(child.childNodes.length > 0) {
			result += snst + __endTag(child);
		}
	}
	
	return result;
}
