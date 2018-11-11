# JAvascript Voicexml InterpretER 
### This is the JavaScript implementation, if you're looking for the Java implementation take a look at [javier-java-code](https://github.com/edgarmedrano/javier-java-code)

To know more about JAVIER, please visit (http://javier.sourceforge.net/getstart.html).

## Who or what is JAVIER?
JAVIER is a JAvascript Voicexml InterpretER, designed (but not restricted) to run inside a web browser, its main engine has less than 1000 lines of code. It's maybe, the tiniest but (almost) FULL VoiceXML implementation.

Javier is also an spanish person name and ironically its pronunciation in spanish sounds like "have-ear", and that's why i prefer to refer to JAVIER as if it were person rather than just a software.

## Well, how can i reach JAVIER?
### Using a Web browser
JAVIER can run inside any web browser, but if the browser supports the Web Speech API or the MS SAPI you'll have a better experience. 
If you want to try it, take a quick look at the [online version](http://javier.sourceforge.net/javier/index.html).

### Using phones and/or softphones connected to Asterisk + JAVIER AGI server
In a M$ Windows box with MS Speech API, you can deploy JAVIER as an AGI server, then you can map that server to an Asterisk extension via TCP and use a phone or softphone to reach that extension. 

Note: the M$ Windows box will supply the audio files and you need to mount a shared resource in the Asterisk box to be able to stream those files. 

### Using the M$ Windows Console Client or GUI Client
In a M$ Windows box with MS Speech API, you can run JAVIER as a console application or as a GUI App.

### Using a Jabber/XMPP Client to chat with a JAVIER Jabber/XMPP Client
You can deploy JAVIER as a Jabber chatbot if you connect the JAVIER Jabber/XMPP Client to any Jabber/XMPP server and then you will be able text JAVIER's chatbot account with any Jabber/XMPP client.
