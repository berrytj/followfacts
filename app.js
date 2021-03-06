
//                            *************                              //
//    APP FOR AGGREGATING FACTS, COMMENTS, AND NUGGETS OF INFORMATION    //
//                            *************                              //

// Using node-monkey to inspect objects with Chrome dev tools.
var nomo = require('node-monkey').start();

var express = require('express')
	, routes = require('./routes')
	, user = require('./routes/user')
	, http = require('http')
	, path = require('path');

var app = express();

app.configure(function() {

	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.cookieSession({ secret: 'dundundun' }));
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(require('less-middleware')({ src: __dirname + '/public' }));
	app.use(express.static(path.join(__dirname, 'public')));

});

app.configure('development', function() {
	app.use(express.errorHandler());
});

// Still playing around with general app functionality / routes:

app.get('/', routes.search);
app.post('/', routes.respond);

app.get('/reddit', routes.reddit);
app.post('/reddit', routes.reddit);

//app.get('/keyword/:keyword', routes.keyword);
//app.get('/users', user.list);

//var reddit = require('./collect_data/reddit');
//reddit.collect();

// Run the app:
http.createServer(app).listen(app.get('port'), function() {
		console.log('Express server listening on port ' + app.get('port'));
});







