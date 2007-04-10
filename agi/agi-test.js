var agi = new AGI();
var stderr = __stderr__;

try {
	//agi.appexec('festival','Welcome to Klass Technologies.  Thank you for calling.')
	//agi.appexec('festival','This is a test of the text to speech engine.')
	//agi.appexec('festival','Press 1 for sales ')
	//agi.appexec('festival','Press 2 for customer support ')
	//agi.hangup()
	agi.goto_on_exit(extension='1234', priority='1')
	//sys.exit(0)
	agi.say_digits('123', [4,'5',6])
	agi.say_digits([4,5,6])
	agi.say_number('1234')
	agi.say_number('01234')  // 668
	agi.say_number('0xf5')   // 245
	agi.get_data('demo-congrats')
	/*
	agi.hangup()
	sys.exit(0)
	*/
	//agi.record_file('pyst-test') //FAILS
	agi.stream_file('demo-congrats', [1,2,3,4,5,6,7,8,9,0,'#','*'])
	//agi.appexec('background','demo-congrats')

	try {
		agi.appexec('backgrounder','demo-congrats')
	} catch(e) {
		if(e instanceof AGIAppError) {
			stderr.write("Handled exception for missing application backgrounder\n")
		} else { // Python compatibility
			throw(e);
		}
	}

	agi.set_variable('foo','bar')
	agi.get_variable('foo')

	try {
		agi.get_variable('foobar')
	} catch(e) {
		if(e instanceof AGIAppError) {
			stderr.write("Handled exception for missing variable foobar\n")
		} else { // Python compatibility
			throw(e);
		}
	}

	try {
		agi.database_put('foo', 'bar', 'foobar')
		agi.database_put('foo', 'baz', 'foobaz')
		agi.database_put('foo', 'bat', 'foobat')
		v = agi.database_get('foo', 'bar')
		stderr.write('DBVALUE foo:bar = {1}\n', v)
		v = agi.database_get('bar', 'foo')
		stderr.write('DBVALUE foo:bar = {1}\n', v)
		agi.database_del('foo', 'bar')
		agi.database_deltree('foo')
	} catch(e) {
		if(e instanceof AGIDBError) {
			stderr.write("Handled exception for missing database entry bar:foo\n")
		} else { // Python compatibility
			throw(e);
		}
	}

	agi.hangup()
} catch(e) {
	stderr.write(e.name + ":\n" + e.message);
}