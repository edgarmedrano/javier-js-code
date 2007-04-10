var TTSHandler = false;
var WshShell = new ActiveXObject("WScript.Shell");

try {
	TTSHandler = new ActiveXObject("Sapi.SpVoice");
} catch(exception) {
	if(AGIHandler) {
		WScript.Echo("Unable to load Sapi.SpVoice");
	}
}

function setVoice(voiceName) {
	if(TTSHandler) {
		var TTSVoices = TTSHandler.GetVoices();
		
		for(var i=0; i < TTSVoices.Count; i++) {
			if(TTSVoices.Item(i).GetDescription().indexOf(voiceName) >= 0) {
				TTSHandler.Voice = TTSVoices.Item(i);
				return true;
			}
		}
	} else {
		return true;
	}
	
	return false;
}

setVoice("Sam");

WScript.Echo("1,");
//Private Sub TextToWav(strText As String, strFile As String, strVoice As String)
// Create a wave stream
var cpFileStream = new ActiveXObject("SAPI.SpFileStream");
var filename = "javier";

WScript.Echo("2,");
//   Set audio format
cpFileStream.Format.Type = 4; // SAFT8kHz8BitMono

WScript.Echo("3,");
//   Create a new .wav file for writing. False indicates that we're not
//   interested in writing events into the .wav file.
//   Note - this line of code will fail if the file exists and is currently open.
cpFileStream.Open(filename + ".wav", 3 /* SSFMCreateForWrite */, true);

WScript.Echo("3.5,");
TTSHandler.AllowAudioOutputFormatChangesOnNextSet = false;
WScript.Echo("4,");
//   Set the .wav file stream as the output for the Voice object
TTSHandler.AudioOutputStream = cpFileStream;

WScript.Echo("5,");
//   Calling the Speak method now will send the output to the "SimpTTS.wav" file.
//   We use the SVSFDefault flag so this call does not return until the file is
//   completely written.
TTSHandler.Speak("Hola mundo", 0 /* SVSFDefault */);

WScript.Echo("6,");
//   Close the file
cpFileStream.Close();

WScript.Echo("7,");
delete cpFileStream;

WScript.Echo("8,");
var oExec = WshShell.Exec("sox " + filename + ".wav " + filename + ".gsm");
WScript.Echo("9,");
while (oExec.Status == 0) {
	 WScript.Sleep(100);
}

WScript.Echo("10");

