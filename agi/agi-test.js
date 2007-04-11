
// Setup some variables
var AGI = new Object(); 
var result;

var strLine = __trim(WScript.StdIn.ReadLine());
while(strLine != "" && strLine != "\n") {
	strLine = strLine.split(":");
	AGI[strLine[0].substr(4)] = strLine[1];
	strLine = __trim(WScript.StdIn.ReadLine());
}

WScript.StdErr.WriteLine("AGI Environment Dump:");
for(var i in AGI) {
	WScript.StdErr.WriteLine("-- " + i + " = " + AGI[i]);
}

function __trim(trimString) {
	return trimString.replace(/^\s+|\s+$/g,"");
}

function checkresult(res) {
	res = __trim(res);
	if (res.match(/^200/)) {
		res =res.match(/result=(-?\d+)/);
		if (!res) {
			WScript.StdErr.WriteLine("FAIL (" + res + ")");
			return 0;
		} else {
			WScript.StdErr.WriteLine("PASS (" + res + ")");
			return res;
		}
	} else {
		WScript.StdErr.WriteLine("FAIL (unexpected result " + res + ")");
		return -1;
	}
}

WScript.StdErr.WriteLine("1.  Testing 'sendfile'...");
WScript.StdOut.WriteLine("STREAM FILE auth-thankyou \"\"");
result = WScript.StdIn.ReadLine();
checkresult(result);
WScript.StdErr.WriteLine("1.  Testing 'sendfile'...");
WScript.StdOut.WriteLine("STREAM FILE beep \"\"");
result = WScript.StdIn.ReadLine();
checkresult(result);

WScript.StdErr.WriteLine("2.  Testing 'sendtext'...");
WScript.StdOut.WriteLine("SEND TEXT \"hello world\"");
result = WScript.StdIn.ReadLine();
checkresult(result);

WScript.StdErr.WriteLine("3.  Testing 'sendimage'...");
//WScript.StdOut.WriteLine("SEND IMAGE asterisk-image");
WScript.StdOut.WriteLine("SEND IMAGE play");
result = WScript.StdIn.ReadLine();
checkresult(result);

WScript.StdErr.WriteLine("4.  Testing 'saynumber'...");
WScript.StdOut.WriteLine("SAY NUMBER 159 \"\"");
result = WScript.StdIn.ReadLine();
checkresult(result);

WScript.StdErr.WriteLine("5.  Testing 'waitdtmf'...");
WScript.StdOut.WriteLine("STREAM FILE conf-getpin \"\"");
result = WScript.StdIn.ReadLine();
checkresult(result);
WScript.StdOut.WriteLine("WAIT FOR DIGIT 10000");
result = WScript.StdIn.ReadLine();
checkresult(result);

WScript.StdErr.WriteLine("6.  Testing 'record'...");
WScript.StdOut.WriteLine("STREAM FILE vm-leavemsg \"\"");
result = WScript.StdIn.ReadLine();
checkresult(result);
WScript.StdOut.WriteLine("RECORD FILE testagi gsm 1234 3000");
result = WScript.StdIn.ReadLine();
checkresult(result);

WScript.StdErr.WriteLine("6a.  Testing 'record' playback...");
WScript.StdOut.WriteLine("STREAM FILE testagi \"\"");
result = WScript.StdIn.ReadLine();
checkresult(result);

WScript.StdErr.WriteLine("7a. GET DATA ");
WScript.StdOut.WriteLine("GET DATA vm-reenterpassword 10000 3 ");
result = WScript.StdIn.ReadLine();
result = checkresult(result);
//result = result.match(s/^.*=(.*)$/\1/);
WScript.StdErr.WriteLine("digits are " + result);

WScript.StdErr.WriteLine("7b.  Testing say digit result");
WScript.StdOut.WriteLine("SAY NUMBER " + result + " \"\"");
result = WScript.StdIn.ReadLine();
checkresult(result);