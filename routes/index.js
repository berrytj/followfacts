

var rest = require('../rest');

var twitter = function(req, res) {
  
	var keyword = req.body.keyword;
	var params = {
		q: keyword,
		'result_type': 'popular',
		//count: '2',
	};
	
	var param_string = '';
	for (var prop in params) {
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

exports.reddit = function(req, res) {

	var mongo = require('mongodb');
	var Server = mongo.Server;
	var Db = mongo.Db;
	var Connection = mongo.Connection;
	var host = 'localhost';
	var port = Connection.DEFAULT_PORT;
	var db = new Db('reddit', new Server(host, port, {}), {w:1});

	db.open(function(err, db) {

		db.collection('comments_top', function(err, coll) {
		//db.collection('comments_smart', function(err, coll) {

			coll.find().sort({ quality: -1 }).toArray(function(err, results) {

				results = results.slice(0, 200);
				res.render('reddit', { title: 'Comments', comments: results });

			});
		});
	});
	
};










