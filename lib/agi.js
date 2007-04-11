/*------------------------------------------------------------------------
  File:        agi.js
  Description: Functions and "classes" to implement AGI scripts
               (Intentionally similar to agi.py from
			    http://sourceforge.net/projects/pyst/)
  Author:      Edgar Medrano Pérez 
               edgarmedrano at gmail dot com
  Created:     2007.04.05
  Company:     JAVIER project
               http://javier.sourceforge.net
  Notes:       
------------------------------------------------------------------------*/

function AGI() {
	// Start of Python compatibility
	var self = this, False = false, True = true;
	var sys = { argv: __argv__, stdin: __stdin__, stdout: __stdout__, stderr: __stderr__ };
	function str(variable) { return "" + variable; }
	String.prototype.strip = function () { return this.replace(/^\s+|\s+$/g,""); }	
	Object.prototype.toString = function () {
		var __r__ = "";
		for(var __n__ in this) { __r__ += (__r__ == "" ? "" : ",") + __n__ + ": " + (typeof(this[__n__]) == "string" ? '"' + this[__n__] +  '"' : this[__n__]); }
		return "{" + __r__ + "}";
	}
	// End of Python compatibility

	var DEFAULT_TIMEOUT = 2000 // 2sec timeout used as default for functions that take timeouts
	var DEFAULT_RECORD  = 20000 // 20sec record time
	
	var re_code = /(^\d*)\s*(.*)/;
	var re_kv = /(\w+)=([^\s]+)\s*(?:\((.*)\))*/;

	function AGIException(message) {
		this.name = this.constructor.name;
		this.message = message;
	}
	function AGIError(message) { AGIException.call(this,message); }

	function AGIUnknownError(message) { AGIError.call(this,message); }

	function AGIAppError(message) { AGIError.call(this,message); }

	// there are several different types of hangups we can detect
	// they all are derrived from AGIHangup
	function AGIHangup(message) { AGIAppError.call(this,message); }
	function AGISIGUPHangup(message) { AGIHangup.call(this,message); }
	function AGISIGPIPEHangup(message) { AGIHangup.call(this,message); }
	function AGIResultHangup(message) { AGIHangup.call(this,message); }

	function AGIDBError(message) { AGIAppError.call(this,message); }

	function AGIUsageError(message) { AGIError.call(this,message); }
	function AGIInvalidCommand(message) { AGIError.call(this,message); }
	
	/* 
	This class encapsulates communication between Asterisk and Javascript.
	It handles encoding commands to Asterisk and parsing responses from
	Asterisk. 
	*/

	self.__init__ = function () {
		self._got_sighup = False
		//signal.signal(signal.SIGHUP, self._handle_sighup)  // handle SIGHUP
		sys.stderr.write('ARGS: ')
		sys.stderr.write(str(sys.argv))
		sys.stderr.write('\n')
		self.env = {}
		self._get_agi_env()
	}
	
	self._get_agi_env = function () {
		while(1) {
			var line = sys.stdin.readline().strip();
			sys.stderr.write('ENV LINE: ')
			sys.stderr.write(line)
			sys.stderr.write('\n')
			if(line == '') {
				// blank line signals end
				break;
			}
			line = line.split(':');
			var key = line[0].strip();
			var data = line.length > 1 ? line[1].strip() : "";
			if(key != "") {
				self.env[key] = data;
			}
		}
		sys.stderr.write('class AGI: self.env = ')
		sys.stderr.write(str(self.env))
		sys.stderr.write('\n')
	}
	
	self._quote = function (text) {
		return ['\"', text, '\"'].join('');
	}

	self._handle_sighup = function (signum, frame) {
		/* Handle the SIGHUP signal */
		self._got_sighup = True
	}

	self.test_hangup = function () {
		/* This function throws AGIHangup if we have recieved a SIGHUP */
		if(self._got_sighup) {
			throw(new AGISIGHUPHangup("Received SIGHUP from Asterisk"));
		}
	}
	
	self.execute = function (command) {
		var args = new Array();
		for(var i = 1; i < arguments.length; i++) {
			args[i - 1] = arguments[i];
		}
		try {
			self.send_command(command,args)
			var result;
			if(self.multithread) {
				while(!(result = self.result)) {
					sys.stderr.write("execute \n")
					sys.sleep(1);
				}
				self.result = null;
			} else {
				result = self.get_result();
			}
			return result;
		} catch(e) {
			if(e == 32) {
				// Broken Pipe * let us go
				throw(new AGISIGPIPEHangup("Received SIGPIPE"));
			} else {
				throw(e);
			}
		}
	}
	
	self.send_command = function (command,args) {
		/* Send a command to Asterisk */
		command = command.strip()
		command += " " + args.join(" ");
		command = command.strip()
		if(command.charAt(command.length - 1) != '\n') {
			command += '\n'
		}
		
		sys.stderr.writeln('    COMMAND: {1}',command)
		
		if(self.multithread) {
			self.command = command;
			while(self.command != "") {
				sys.stderr.write("command \n")
				sys.sleep(1);
			}
		} else {
			sys.stdout.write(command)
			sys.stdout.flush()
		}
	}
	
	self.get_result = function (stdin) {
		if(!stdin) { stdin = sys.stdin; }
		/* Read the result of a command from Asterisk */
		var code = 0;
		var result = { result:['',''] };
		var line = stdin.readline().strip();
		var response;
		sys.stderr.write('    RESULT_LINE: {1}\n', line)
		//var m = re_code.exec(line);
		var	m = line.match(re_code);
		if(m) {
			code = m.length > 1 ? m[1] : "";
			response = m.length > 2 ? m[2] : "";
			code = parseInt(code)
		}
		if(code == 200) {
			//m = re_kv.exec(response);
			m = response.match(re_kv);
			var key = "";
			var value = "";
			var data = "";
			
			if(m) {
				key = m.length > 1 ? m[1] : "";
				value = m.length > 2 ? m[2] : "";
				data = m.length > 3 ? m[3] : "";
			}
			
			if(key != "") {
				result[key] = [value, data];
			}
			
			// If user hangs up... we get 'hangup' in the data
			if(data == 'hangup') {
				throw(new AGIResultHangup("User hungup during execution"));
			}

			if(key == 'result' && value == '-1') {
				throw(new AGIAppError("Error executing application, or hangup"));
			}

			sys.stderr.write('    RESULT_DICT: {1}\n',result)
			return result
		} else if(code == 510) {
			throw(new AGIInvalidCommand(response));
		} else if(code == 520) {
			var usage = [line];
			line = stdin.readline().strip()
			while(line.substring(0,3) != '520') {
				usage.push(line);
				line = stdin.readline().strip()
			}
			usage.push(line);
			usage = usage.join('\n') + '\n';
			throw(new AGIUsageError(usage));
		} else {
			throw(new AGIUnknownError(code, 'Unhandled code or undefined response'));
		}
	}

    self._process_digit_list = function (digits) {
        if(digits && digits.join) {
            digits = digits.join('');
		}
        return self._quote(digits)
	}	

    self.answer = function () {
        /* agi.answer() --> None
        Answer channel if not already in answer state.
        */
        self.execute('ANSWER')['result'][0]
	}

    self.wait_for_digit = function (timeout) {
		timeout = timeout ? timeout : DEFAULT_TIMEOUT;
        /* agi.wait_for_digit(timeout=DEFAULT_TIMEOUT) --> digit
        Waits for up to 'timeout' milliseconds for a channel to receive a DTMF
        digit.  Returns digit dialed
        Throws AGIError on channel falure
        */
        var res = self.execute('WAIT FOR DIGIT', timeout)['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to digit: ' + res));
			}
		}
	}

    self.send_text = function (text) {
		text = text ? text : '';
        /* agi.send_text(text='') --> None
        Sends the given text on a channel.  Most channels do not support the
        transmission of text.
        Throws AGIError on error/hangup
        */
        self.execute('SEND TEXT', self._quote(text))['result'][0]
	}

    self.receive_char = function (timeout) {
		timeout = timeout ? timeout : DEFAULT_TIMEOUT;
        /* agi.receive_char(timeout=DEFAULT_TIMEOUT) --> chr
        Receives a character of text on a channel.  Specify timeout to be the
        maximum time to wait for input in milliseconds, or 0 for infinite. Most channels
        do not support the reception of text.
        */
        var res = self.execute('RECEIVE CHAR', timeout)['result'][0];

        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}			

    self.tdd_mode = function (mode) {
		mode = mode ? mode : 'off';
        /* agi.tdd_mode(mode='on'|'off') --> None
        Enable/Disable TDD transmission/reception on a channel. 
        Throws AGIAppError if channel is not TDD-capable.
        */
        var res = self.execute('TDD MODE', mode)['result'][0];
        if(res == '0') {
            throw(new AGIAppError('Channel is not TDD-capable'));
		}
	}
            
    self.stream_file = function (filename, escape_digits, sample_offset) {
		escape_digits = escape_digits ? escape_digits : '';
		sample_offset = sample_offset ? sample_offset : 0;
        /* agi.stream_file(filename, escape_digits='', sample_offset=0) --> digit
        Send the given file, allowing playback to be interrupted by the given
        digits, if any.  escape_digits is a string '12345' or a list  of 
        ints [1,2,3,4,5] or strings ['1','2','3'] or mixed [1,'2',3,'4']
        If sample offset is provided then the audio will seek to sample
        offset before play starts.  Returns  digit if one was pressed.
        Throws AGIError if the channel was disconnected.  Remember, the file
        extension must not be included in the filename.
        */
        escape_digits = self._process_digit_list(escape_digits);
        var response = self.execute('STREAM FILE', filename, escape_digits, sample_offset);
        var res = response['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}
    
    self.control_stream_file = function (filename, escape_digits, skipms, fwd, rew, pause) {
		escape_digits = escape_digits ? escape_digits : '';
		skipms = skipms ? skipms : 3000;
		fwd = fwd ? fwd : '';
		rew = rew ? rew : '';
		pause = pause ? pause : '';
        /*
        Send the given file, allowing playback to be interrupted by the given
        digits, if any.  escape_digits is a string '12345' or a list  of 
        ints [1,2,3,4,5] or strings ['1','2','3'] or mixed [1,'2',3,'4']
        If sample offset is provided then the audio will seek to sample
        offset before play starts.  Returns  digit if one was pressed.
        Throws AGIError if the channel was disconnected.  Remember, the file
        extension must not be included in the filename.
        */
        escape_digits = self._process_digit_list(escape_digits)
        var response = self.execute('CONTROL STREAM FILE', self._quote(filename), escape_digits, self._quote(skipms), self._quote(fwd), self._quote(rew), self._quote(pause));
        var res = response['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}

    self.send_image = function (filename) {
        /* agi.send_image(filename) --> None
        Sends the given image on a channel.  Most channels do not support the
        transmission of images.   Image names should not include extensions.
        Throws AGIError on channel failure
        */
        var res = self.execute('SEND IMAGE', filename)['result'][0];
        if(res != '0') {
            throw(new AGIAppError('Channel falure on channel ' + self.env.get('agi_channel','UNKNOWN')));
		}
	}

    self.say_digits = function (digits, escape_digits) {
		escape_digits = escape_digits ? escape_digits : '';
        /* agi.say_digits(digits, escape_digits='') --> digit
        Say a given digit string, returning early if any of the given DTMF digits
        are received on the channel.  
        Throws AGIError on channel failure
        */
        digits = self._process_digit_list(digits)
        escape_digits = self._process_digit_list(escape_digits)
        var res = self.execute('SAY DIGITS', digits, escape_digits)['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}

    self.say_number = function (number, escape_digits) {
		escape_digits = escape_digits ? escape_digits : '';
        /* agi.say_number(number, escape_digits='') --> digit
        Say a given digit string, returning early if any of the given DTMF digits
        are received on the channel.  
        Throws AGIError on channel failure
        */
        number = self._process_digit_list(number)
        escape_digits = self._process_digit_list(escape_digits)
        var res = self.execute('SAY NUMBER', number, escape_digits)['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}

    self.say_alpha = function (characters, escape_digits) {
		escape_digits = escape_digits ? escape_digits : '';
        /* agi.say_alpha(string, escape_digits='') --> digit
        Say a given character string, returning early if any of the given DTMF
        digits are received on the channel.  
        Throws AGIError on channel failure
        */
        characters = self._process_digit_list(characters)
        escape_digits = self._process_digit_list(escape_digits)
        var res = self.execute('SAY ALPHA', characters, escape_digits)['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}

    self.say_phonetic = function (characters, escape_digits) {
		escape_digits = escape_digits ? escape_digits : '';
        /* agi.say_phonetic(string, escape_digits='') --> digit
        Phonetically say a given character string, returning early if any of
        the given DTMF digits are received on the channel.  
        Throws AGIError on channel failure
        */
        characters = self._process_digit_list(characters)
        escape_digits = self._process_digit_list(escape_digits)
        var res = self.execute('SAY PHONETIC', characters, escape_digits)['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}

    self.say_date = function (seconds, escape_digits) {
		escape_digits = escape_digits ? escape_digits : '';
        /* agi.say_date(seconds, escape_digits='') --> digit
        Say a given date, returning early if any of the given DTMF digits are
        pressed.  The date should be in seconds since the UNIX Epoch (Jan 1, 1970 00:00:00)
        */
        escape_digits = self._process_digit_list(escape_digits)
        var res = self.execute('SAY DATE', seconds, escape_digits)['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}

    self.say_time = function (seconds, escape_digits) {
		escape_digits = escape_digits ? escape_digits : '';
        /* agi.say_time(seconds, escape_digits='') --> digit
        Say a given time, returning early if any of the given DTMF digits are
        pressed.  The time should be in seconds since the UNIX Epoch (Jan 1, 1970 00:00:00)
        */
        escape_digits = self._process_digit_list(escape_digits)
        var res = self.execute('SAY TIME', seconds, escape_digits)['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}
    
    self.say_datetime = function (seconds, escape_digits, format, zone) {
		escape_digits = escape_digits ? escape_digits : '';
		format = format ? format : '';
		zone = zone ? zone : '';
        /* agi.say_datetime(seconds, escape_digits='', format='', zone='') --> digit
        Say a given date in the format specfied (see voicemail.conf), returning
        early if any of the given DTMF digits are pressed.  The date should be
        in seconds since the UNIX Epoch (Jan 1, 1970 00:00:00).
        */
        escape_digits = self._process_digit_list(escape_digits)
        if(format) { format = self._quote(format) }
        var res = self.execute('SAY DATETIME', seconds, escape_digits, format, zone)['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}

    self.get_data = function (filename, timeout, max_digits) {
		timeout = timeout ? timeout : DEFAULT_TIMEOUT;
		max_digits = max_digits ? max_digits : 255;
        /* agi.get_data(filename, timeout=DEFAULT_TIMEOUT, max_digits=255) --> digits
        Stream the given file and receive dialed digits
        */
        var result = self.execute('GET DATA', filename, timeout, max_digits);
        var res = result['result'][0];
        var value = result['result'][1];
        return res
	}
    
    self.get_option = function (filename, escape_digits, timeout) {
		escape_digits = escape_digits ? escape_digits : '';
		timeout = timeout ? timeout : 0;
        /* agi.get_option(filename, escape_digits='', timeout=0) --> digit
        Send the given file, allowing playback to be interrupted by the given
        digits, if any.  escape_digits is a string '12345' or a list  of 
        ints [1,2,3,4,5] or strings ['1','2','3'] or mixed [1,'2',3,'4']
        Returns  digit if one was pressed.
        Throws AGIError if the channel was disconnected.  Remember, the file
        extension must not be included in the filename.
        */
        escape_digits = self._process_digit_list(escape_digits)
		var response;
        if(timeout) {
            response = self.execute('GET OPTION', filename, escape_digits, timeout)
        } else {
            response = self.execute('GET OPTION', filename, escape_digits)
		}

        var res = response['result'][0];
        if(res == '0') {
            return ''
        } else {
            try {
                return String.fromCharCode(parseInt(res));
            } catch(e) {
                throw(new AGIError('Unable to convert result to char: ' + res));
			}
		}
	}

    self.set_context = function (context) {
        /* agi.set_context(context)
        Sets the context for continuation upon exiting the application.
        No error appears to be produced.  Does not set exten or priority
        Use at your own risk.  Ensure that you specify a valid context.
        */
        self.execute('SET CONTEXT', context)
	}

    self.set_extension = function (extension) {
        /* agi.set_extension(extension)
        Sets the extension for continuation upon exiting the application.
        No error appears to be produced.  Does not set context or priority
        Use at your own risk.  Ensure that you specify a valid extension.
        */
        self.execute('SET EXTENSION', extension)
	}

    self.set_priority = function (priority) {
        /* agi.set_priority(priority)
        Sets the priority for continuation upon exiting the application.
        No error appears to be produced.  Does not set exten or context
        Use at your own risk.  Ensure that you specify a valid priority.
        */
        self.execute('set priority', priority)
	}

    self.goto_on_exit = function (context, extension, priority) {
        context = context ? context : self.env['agi_context'];
        extension = extension ? extension : self.env['agi_extension'];
        priority = priority ? priority : self.env['agi_priority'];
        self.set_context(context)
        self.set_extension(extension)
        self.set_priority(priority)
	}

    self.record_file = function (filename, format, escape_digits, timeout, offset, beep) {
		format = format ? format : 'gsm';
		escape_digits = escape_digits ? escape_digits : '#';
		timeout = timeout ? timeout : DEFAULT_TIMEOUT;
		offset = offset ? offset : 0;
		beep = beep ? beep : 'beep';
        /* agi.record_file(filename, format, escape_digits, timeout=DEFAULT_TIMEOUT, offset=0, beep='beep') --> None
        Record to a file until a given dtmf digit in the sequence is received
        The format will specify what kind of file will be recorded.  The timeout 
        is the maximum record time in milliseconds, or -1 for no timeout. Offset 
        samples is optional, and if provided will seek to the offset without 
        exceeding the end of the file
        */
        escape_digits = self._process_digit_list(escape_digits)
        var res = self.execute('RECORD FILE', self._quote(filename), format, escape_digits, timeout, offset, beep)['result'][0];
        try {
            return String.fromCharCode(parseInt(res));
        } catch(e) {
            throw(new AGIError('Unable to convert result to digit: ' + res));
		}
	}

    self.set_autohangup = function (secs) {
        /* agi.set_autohangup(secs) --> None
        Cause the channel to automatically hangup at <time> seconds in the
        future.  Of course it can be hungup before then as well.   Setting to
        0 will cause the autohangup feature to be disabled on this channel.
        */
        self.execute('SET AUTOHANGUP', time)
	}

    self.hangup = function (channel) {
		channel = channel ? channel : '';
        /* agi.hangup(channel='')
        Hangs up the specified channel.
        If no channel name is given, hangs up the current channel
        */
        self.execute('HANGUP', channel)
	}

    self.appexec = function (application, options) {
		options = options ? options : '';
        /* agi.appexec(application, options='')
        Executes <application> with given <options>.
        Returns whatever the application returns, or -2 on failure to find
        application
        */
        var result = self.execute('EXEC', application, self._quote(options));
        var res = result['result'][0];
        if(res == '-2') {
            throw(new AGIAppError('Unable to find application: ' + application));
		}
        return res
	}

    self.set_callerid = function (number) {
        /* agi.set_callerid(number) --> None
        Changes the callerid of the current channel.
        */
        self.execute('SET CALLERID', number)
	}

    self.channel_status = function (channel) {
		channel = channel ? channel : '';
        /* agi.channel_status(channel='') --> int
        Returns the status of the specified channel.  If no channel name is
        given the returns the status of the current channel.

        Return values:
        0 Channel is down and available
        1 Channel is down, but reserved
        2 Channel is off hook
        3 Digits (or equivalent) have been dialed
        4 Line is ringing
        5 Remote end is ringing
        6 Line is up
        7 Line is busy
        */
		var result;
		
        try {
           result = self.execute('CHANNEL STATUS', channel)
        } catch(e) {
			if(e instanceof AGIHangup) {
				throw(e);
			} else if(e instanceof AGIAppError) {
				result = {'result': ['-1','']};
			} else { // Python compatibility
				throw(e);
			}
		}

        return parseInt(result['result'][0])
	}

    self.set_variable = function (name, value) {
        /* Set a channel variable.
        */
        self.execute('SET VARIABLE', self._quote(name), self._quote(value))
	}

    self.get_variable = function (name) {
        /* Get a channel variable.

        This function returns the value of the indicated channel variable.  If
        the variable is not set, an empty string is returned.
        */
		var result;
        try {
           result = self.execute('GET VARIABLE', self._quote(name))
        } catch(e) {
			if(e instanceof AGIResultHangup) {
				result = {'result': ['1', 'hangup']};
			} else { // Python compatibility
				throw(e);
			}
		}

        var value = result['result'][1];
        return value;
	}

    self.get_full_variable = function (name, channel) {
		channel = channel ? channel : false;
        /* Get a channel variable.

        This function returns the value of the indicated channel variable.  If
        the variable is not set, an empty string is returned.
        */
		var result;
        try {
            if(channel) {
                result = self.execute('GET FULL VARIABLE', self._quote(name), self._quote(channel))
            } else {
	            result = self.execute('GET FULL VARIABLE', self._quote(name))
			}
        } catch(e) {
			if(e instanceof AGIResultHangup) {
				result = {'result': ['1', 'hangup']};
			} else { // Python compatibility
				throw(e);
			}
		}

        var value = result['result'][1];
        return value;
	}

    self.verbose = function (message, level) {
		level = level ? level : 1;	
        /* agi.verbose(message='', level=1) --> None
        Sends <message> to the console via verbose message system.
        <level> is the the verbose level (1-4)
        */
        self.execute('VERBOSE', self._quote(message), level)
	}

    self.database_get = function (family, key) {
        /* agi.database_get(family, key) --> str
        Retrieves an entry in the Asterisk database for a given family and key.
        Returns 0 if <key> is not set.  Returns 1 if <key>
        is set and returns the variable in parenthesis
        example return code: 200 result=1 (testvariable)
        */
        var result = self.execute('DATABASE GET', self._quote(family), self._quote(key));
		var res = result['result'][0];
        var value = result['result'][1];
        if(res == '0') {
            throw(new AGIDBError('Key not found in database: family=' + family + ', key=' + key));
        } else if(res == '1') {
            return value
        } else {
            throw(new AGIError('Unknown exception for : family=' + family + ', key=' + key + ', result=' + result));
		}
	}

    self.database_put = function (family, key, value) {
        /* agi.database_put(family, key, value) --> None
        Adds or updates an entry in the Asterisk database for a
        given family, key, and value.
        */
        var result = self.execute('DATABASE PUT', self._quote(family), self._quote(key), self._quote(value));
        var res = result['result'][0];
        var value = result['result'][1];
        if(res == '0') {
            throw(new AGIDBError('Unable to put vaule in databale: family=' + family + ', key=' + key + ', value=' + value));
		}
	}
            
    self.database_del = function (family, key) {
        /* agi.database_del(family, key) --> None
        Deletes an entry in the Asterisk database for a
        given family and key.
        */
        var result = self.execute('DATABASE DEL', self._quote(family), self._quote(key));
        var res = result['result'][0];
        var value = result['result'][1];
        if(res == '0') {
            throw(new AGIDBError('Unable to delete from database: family=%s, key=%s' % (family, key)));
		}
	}

    self.database_deltree = function (family, key) {
		key = key ? key : '';
        /* agi.database_deltree(family, key='') --> None
        Deletes a family or specific keytree with in a family
        in the Asterisk database.
        */
        var result = self.execute('DATABASE DELTREE', self._quote(family), self._quote(key));
        var res = result['result'][0];
        var value = result['result'][1];
        if(res == '0') {
            throw(new AGIDBError('Unable to delete tree from database: family=%s, key=%s' % (family, key)));
		}
	}

    self.noop = function () {
        /* agi.noop() --> None
        Does nothing
        */
        self.execute('NOOP')
	}
	
	self.__init__();

	// the following code implement multithreading behavior
	self.multithread = False; // Singlethreaded by default
	self.command = "";
	self.result = null;
	sys.sleep = function(time) { 
		//sys.stdout.write("get_result\n")
		//WScript.Sleep(100);
		WScript.Sleep(time);
	};
	//sys.sleepe = sys.sleep;
	sys.sleepe = function(time) { 
		//sys.stdout.write("evenLoop\n")
		//WScript.Sleep(100);
		WScript.Sleep(time);
	};
	
	self.eventLoop = function () {
		self.multithread = true;
		for(;;) {
			if(self.command != "") {
				sys.stdout.write(self.command);
				//sys.stdout.flush()
				self.command = "";
				if(WScript.StdIn.AtEndOfStream) {
					sys.sleepe(1);
				}
				self.result = self.get_result();
				while(self.result) {
					sys.stdout.write("NOOP\n");
					if(WScript.StdIn.AtEndOfStream) {
						sys.sleepe(1);
					}
					self.get_result(); /*we don't care about result*/
				}
			} else {
				//sys.sleepe(1);
				if(self.command == "") {
					sys.stdout.write("EXEC WAIT 0.1\n");
					if(WScript.StdIn.AtEndOfStream) {
						sys.sleepe(1);
					}
					self.get_result(); /*we don't care about result*/
				}
			}
		}
	}
}