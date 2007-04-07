/*------------------------------------------------------------------------
  File:        JScript.js
  Description: JAVIER Browser JScript version
  Author:      Edgar Medrano Pérez 
               edgarmedrano at gmail dot com
  Created:     2007.04.04
  Company:     JAVIER project
               http://javier.sourceforge.net
  Notes:       
------------------------------------------------------------------------*/

function _load(libRelativePath) {
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var libPath = fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName),libRelativePath);
	var f = fso.OpenTextFile(libPath,1 /*for reading*/);
	return f.ReadAll();
}
eval(_load("handlers.wsh.js"));
eval(_load("javier.js"));

var _AppURL = "default.vxml";

if(WScript.Arguments.Count() == 0) {
	Wscript.StdOut.Write("AppURL: ");
	_AppURL = Wscript.StdIn.ReadLine();
} else {
	_AppURL = WScript.Arguments.Item(0);
	if(WScript.Arguments.Count() == 1) {
		Wscript.StdOut.Write("Voice: ");
		var _Voice = Wscript.StdIn.ReadLine();
		if(_Voice != "") {
			setVoice(_Voice);
		}
	} else {
		setVoice(WScript.Arguments.Item(1));	
	}
}

var interpreter = new VXMLInterpreter
	(new JSInHandler()
	,new JSOutHandler()
	,new NetHandler()
	,new LogHandler(WScript.ScriptFullName + ".log")
	,new ErrHandler()
	);

interpreter.run(_AppURL);

WScript.Sleep(10000);