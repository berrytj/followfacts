

var MIN_CHARS = 140;
var MIN_QUAL = 0;
var WAIT = 2100;
var Z_STAT = 1.96;
var count = 1;
var subs = [
	'worldnews',
	'politics',
	'askreddit',
	'worldnews',
	'iama',
	'todayilearned',
	'technology',
	'atheism',
	'science',
	'askscience',
//	'economics'
];

var rest = require('../../rest');  // need to specify '../'?
var mongo = require('mongodb');
var Server = mongo.Server;
var Db = mongo.Db;
var Connection = mongo.Connection;
var host = 'localhost';
var port = Connection.DEFAULT_PORT;
var db = new Db('reddit', new Server(host, port, {}), {w:1});
var colls = {};

db.open(function(err, db) {

	db.collection('posts', function(err, coll) {
		colls.posts = coll;
	});

	db.collection('comments_top', function(err, coll) {
		colls.top = coll;
	});

	db.collection('comments_smart', function(err, coll) {
		colls.smart = coll;
	});

});

exports.getScore = function(score, views) {
	return getQuality(score, views);
};

var getQuality = function(score, views) {
	// Function calculates lower bound of Wilson
	// score confidence interval, explained at:
	// http://www.evanmiller.org/how-not-to-sort-by-average-rating.html

	if (views === 0) return 0;

	var p = score / views;
	var z = Z_STAT;
	var zsq = z * z;
	var sqrt = (p * (1 - p) + zsq / (views * 4)) / views;
	var top = p + zsq / (views * 2) - z * Math.sqrt(sqrt);
	var bottom = 1 + zsq / views;
    var quality = top / bottom;
    return quality;

};

var saveComment = function(comment, comments, url, post_score) {

	if (!comment) {

		colls.posts.update({url:url}, { $set: {done:1} }, {w:0});
		return;

	}

	comment = comment.data;
	var text = comment.body_html;
	var chars = text.length;
								// Post score is a proxy for views here, since the
								// more points a post gets, the more people see it.
	var quality = getQuality(comment.ups, comment.ups + comment.downs);

	// Raise MIN_CHARS?  Or filter at endpoint...
	if (chars > MIN_CHARS && quality > MIN_QUAL) {

		colls.smart.insert({
		//colls.top.insert({

			text:    text,
			quality: quality,
			url:     url

		}, {w:0});

	}

	saveComment(comments.pop(), comments, url, post_score);
};

var saveComments = function(err, result, url) {
	
	var post_score = result[0].data.children[0].data.score;
	var comments = result[1].data.children;
	comments.pop();  // Last object isn't a comment
	saveComment(comments.pop(), comments, url, post_score);

};

var getMorePosts = function(sub, next) {

	if (count < 3) {

		count++;
		console.log('getting next round of posts after id: ' + next);
		getPosts(sub, next);

	} else {

		count = 0;
		console.log('getting posts from new subreddit');
		getPosts(subs.pop());

	}

};

var getCommentsIfNew = function(url, options, item) {

	if (item) {

		//do something if done = 0?
		console.log('already collected comments from posts with url: ' + url);

	} else {

		colls.posts.insert({url:url, done:0}, {w:0});
		rest.getJSON(options, saveComments, url);
		console.log('getting comments for post with url: ' + url);

	}

};

var getComments = function(post, posts, sub, next) {
	
	if (!post) {
		getMorePosts(sub, next);
		return;
	}

	post = post.data;
	var id = post.id;
	var url = post.permalink;
	var options = {
		host: 'api.reddit.com',
		path: '/comments/' + id + '.json?sort=confidence',
		'user-agent': 'follow facts bot v0.01 by /u/tberry860',
	};
	
	colls.posts.find({url:url}).nextObject(function(err, item) {

		getCommentsIfNew(url, options, item);
		
		setTimeout(function() {
			getComments(posts.pop(), posts, sub, next);
		}, WAIT);

	});

};

var savePosts = function(err, result, sub) {
	
	var next = result.data.after;
	var posts = result.data.children;	
	getComments(posts.pop(), posts, sub, next);

};

var getPosts = function(subreddit, next_batch) {
	
	if (!subreddit) {
		console.log('no more subreddits');
		return;
	}

	var after = '';
	if (next_batch) after = '&after=' + next_batch;

	//var path = '/top.json?t=year&limit=100' + after;
	var path = '/r/' + subreddit + '.json?limit=100' + after;
	
	var options = {
		host: 'api.reddit.com',
		path: path,
		'user-agent': 'follow facts bot v0.01 by /u/tberry860',
	};
	
	rest.getJSON(options, savePosts, subreddit);
};

exports.collect = function() {
	getPosts(subs.pop(), 't3_1a06d9');
};





