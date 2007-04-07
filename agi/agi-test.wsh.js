function _load(libRelativePath) {
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var libPath = fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName),libRelativePath);
	var f = fso.OpenTextFile(libPath,1 /*for reading*/);
	return f.ReadAll();
}
eval(_load("agi-hnd.wsh.js"));
eval(_load("agi.js"));
eval(_load("agi-test.js"));
