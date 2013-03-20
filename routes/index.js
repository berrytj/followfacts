

// These subreddits were picked for their
// quality -- subjective and subject to change.
var all_subs = [
	'politics',
	'askreddit',
	'worldnews',
	'todayilearned',
	'technology',
	'atheism',
	'science', 
	'economics'
];

var rest = require('../rest');

var twitter = function(req, res) {
  
	var keyword = req.body.keyword;  // Keyword is in `body` due to POST request.
	var params = {
		q: keyword,
		'result_type': 'popular',
		//count: '2',
	};
	
	var param_string = '';
	for (var prop in params) {  // Create parameter string query Twitter API with.
		if (params.hasOwnProperty(prop)) param_string += '&' + prop + '=' + params[prop];
	}
  
	param_string = param_string.substring(1);  // Remove leading `&`
	var options = rest.getOptions('twitter', param_string);

	rest.getJSON(options, function(status, result) {

		var tweets = result.statuses;
		console.log(tweets);
		res.render('keyword', { title: keyword, tweets: tweets });

	});
	
};

exports.search = function(req, res) {
	res.render('search', { title: 'Search' });
};

exports.respond = function(req, res) {
	
	if (req.body.site === 'Twitter') {
		twitter(req, res);
	} else {
		reddit(req, res);
	}

};

var getDB = function() {

	var mongo = require('mongodb');
	var Server = mongo.Server;
	var Db = mongo.Db;
	var Connection = mongo.Connection;
	var host = 'localhost';
	var port = Connection.DEFAULT_PORT;
	return new Db('reddit', new Server(host, port, {}), {w:1});

};

exports.reddit = function(req, res) {

	var subs = req.body.subs || all_subs;
	var options = { long: true, sub: { $in: subs } };  // Comments with text over 300 chars have long:true.
	var db = getDB();

	db.open(function(err, db) {

		db.collection('comments_smart', function(err, coll) {

			coll.find(options).sort({ quality: -1 }).toArray(function(err, results) {

				if (!results) {
					res.send('');
					return;
				}

				results = results.slice(0, 200); // Just first 200 for now.
				
				res.render('reddit', {

					title:    'Comments',
					comments: results,
					subs:     all_subs,

				});
			});
		});
	});

};










