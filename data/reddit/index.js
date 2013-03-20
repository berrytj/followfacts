

var PER_SUBREDDIT = 3;
var MIN_CHARS = 140;
var MIN_QUAL = 0;
var WAIT = 2100;
var Z_STAT = 1.96;
var count = 0;
var subs = [
	'politics',
	'askreddit',
	'worldnews',
//	'todayilearned',
//	'technology',
//	'atheism',
//	'science',
//	'askscience',
//	'economics'
];
var agent = 'follow facts bot v0.01 by /u/tberry860';

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

// Called from node shell -- to check what the score is for a given comment.
exports.getScore = function(score, views) {
	return getQuality(score, views);
};

// Called from node shell -- will eventually be a periodic script.
exports.collect = function() {
	getPosts(subs.pop());
};

// Get posts for a given subreddit in order to save their
// comments to database -- called recursively in getMorePosts.
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
		'user-agent': agent,
	};
	
	rest.getJSON(options, savePosts, subreddit);
};

// Send posts to getComments for saving.
var savePosts = function(err, result, sub) {
	
	if (err === 'repeat') {
		
		console.log('TRYING AGAIN in savePosts for sub: ' + sub);
		var options = result;

		setTimeout(function() {
			rest.getJSON(options, savePosts, sub);
		}, WAIT);

	} else {

		var next = result.data.after;
		var posts = result.data.children;	
		getComments(posts.pop(), posts, sub, next);

	}
	
};

// Request comments for a given post from the Reddit API.
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
		'user-agent': agent,
	};
	
	// Check if this post is already saved in our DB.
	colls.posts.find({url:url}).nextObject(function(err, item) {

		getCommentsIfNew(url, options, item);
		
		setTimeout(function() {
			// Calling getComments recursively until out of posts,
			// but waiting a few seconds each time per Reddit API rules.
			getComments(posts.pop(), posts, sub, next);
		}, WAIT);

	});

};

// Only get comments if we haven't already collected for this post.
var getCommentsIfNew = function(url, options, item) {

	if (item) {

		//do something if done = 0 (not finished with post)?
		console.log('already collected comments from posts with url: ' + url);

	} else {

		colls.posts.insert({url:url, done:0}, {w:0});
		rest.getJSON(options, saveComments, url);
		console.log('getting comments for post with url: ' + url);

	}

};

var saveComments = function(err, result, url) {
	
	if (err === 'repeat') {
		
		console.log('TRYING AGAIN in saveComments for url: ' + url);
		var options = result;

		setTimeout(function() {
			rest.getJSON(options, saveComments, url);
		}, WAIT);

	} else {
		
		var post_score = result[0].data.children[0].data.score;
		var comments = result[1].data.children;
		comments.pop();  // Last object isn't a comment
		saveComment(comments.pop(), comments, url, post_score);

	}

};

var saveComment = function(comment, comments, url, post_score) {

	if (!comment) {  // No comments are left; mark post complete in DB.

		colls.posts.update({url:url}, { $set: {done:1} }, {w:0});
		return;

	}

	comment = comment.data;
	var text = comment.body_html;
	var chars = text.length;
	var quality = getQuality(comment.ups, comment.ups + comment.downs);

	// Raise MIN_CHARS?  Or filter at endpoint...
	if (chars > MIN_CHARS && quality > MIN_QUAL) {

		colls.smart.insert({    // Collections have different subreddit contents -- still
		//colls.top.insert({    // experimenting to see which yield the most interesting results.

			text:    text,
			quality: quality,
			url:     url

		}, {w:0});

	}

	// Call saveComment recursively until no comments are left.
	saveComment(comments.pop(), comments, url, post_score);
};

var getQuality = function(score, views) {
	// Function calculates lower bound of Wilson
	// score confidence interval, explained at:
	// http://www.evanmiller.org/how-not-to-sort-by-average-rating.html

	if (views === 0) return 0;

	// Equation is split up for clarity.
	var p = score / views;
	var z = Z_STAT;
	var zsq = z * z;
	var sqrt = (p * (1 - p) + zsq / (views * 4)) / views;
	var top = p + zsq / (views * 2) - z * Math.sqrt(sqrt);
	var bottom = 1 + zsq / views;
	return top / bottom;

};

// Get more posts for the given subreddit up until our arbitrarily chosen count.
var getMorePosts = function(sub, next) {

	if (count < PER_SUBREDDIT) {

		count++;
		console.log('getting next round of posts after id: ' + next);
		getPosts(sub, next);

	} else {

		// Move on to the next subreddit once we hit our count.
		count = 0;
		console.log('getting posts from new subreddit');
		getPosts(subs.pop());

	}

};








