

var http = require("http");
var https = require("https");

/**
 * getJSON:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */

var validate = function(res, output, callback, extra) {

	try {

		var obj = JSON.parse(output);
		callback(res.statusCode, obj, extra);

	} catch(ex) {
		
		console.log('ALERT: problem with reddit data.  skipping this request. error: ' + ex);
		//try again?

	}

};

var chunk = function(res, callback, extra) {

 	res.setEncoding('utf8');
		
 	var output = '';

 	res.on('data', function (chunk) {
 		console.log('data received for url ' + extra);
		output += chunk;
	});

 	res.on('end', function() {
		validate(res, output, callback, extra);
	});

};

exports.getJSON = function(options, callback, extra) {

	var protoc = (options.port === 443) ? https : http;

	console.log('about to make json request for url ' + extra);

	var req = protoc.request(options, function(res) {
		console.log('request made for url ' + extra);
		chunk(res, callback, extra);
	});

	req.on('error', function(err) {
		res.send('Inside getJSON, error: ' + err.message);
	});

	req.end();
};


var port = '3000';
var mydomain = 'http://localhost:' + port;
var OAuth = require('oauth').OAuth;

var info = {

	twitter: {

	  host:        'api.twitter.com',
	  path:        '/1.1/search/tweets.json?',
	  extension:   '',
	  app_token:   '51eGw6lgyvZBkalaDfzrw',
	  app_secret:  'upNoKJ8Ly4KFFij0iRABoMjb1uavdBzjASSrswtGdQ',
	  user_token:  '25596212-o396jbBIiiIgGadzXE0G2Gm9OGmGsFKpxf6wVD4k',
	  user_secret: 'NRS5Z5mUhy2sdkQkDZerHGGbib0xDe8tROXeGreeZs',

	},

	reddit: {

	  host:        'api.reddit.com',
	  path:        '/comments/',
	  extension:   '.json',
	  app_token:   '',
	  app_secret:  '',
	  user_token:  '',
	  user_secret: '',

	},

};


exports.getOptions = function(site, params) {

  var props = info[site];

  var oa = new OAuth('https://api.twitter.com/oauth/request_token',
					 'https://api.twitter.com/oauth/access_token',
					 props.app_token,
					 props.app_secret,
					 '1.0',
					 mydomain + '/search', //not relevant?
					 'HMAC-SHA1');

  var auth = oa.authHeader('https://' + props.host + props.path + params + props.extension,
						   props.user_token, props.user_secret, 'GET');

  return {
	host: props.host,
	port: 443,
	path: props.path + params + props.extension,
	method: 'GET',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': auth,
	}
  };

};









