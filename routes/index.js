


var helper = require('../helper');


var mydomain = "http://localhost:3000";
var OAuth = require('oauth').OAuth;
var oa = new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  "51eGw6lgyvZBkalaDfzrw",
  "upNoKJ8Ly4KFFij0iRABoMjb1uavdBzjASSrswtGdQ",
  "1.0",
  mydomain + "/search",
  "HMAC-SHA1"
);

var my_token = '25596212-o396jbBIiiIgGadzXE0G2Gm9OGmGsFKpxf6wVD4k';
var my_secret = 'NRS5Z5mUhy2sdkQkDZerHGGbib0xDe8tROXeGreeZs';


exports.keyword = function(req, res) {
  
  var keyword = req.params.keyword;
  var tweets = [ 'hey', 'ho', 'holla', 'doh' ];

  var authorization = oa.authHeader('https://api.twitter.com/1.1/search/tweets.json',
                                    my_token, my_secret, 'GET');
  var options = {
    host: 'api.twitter.com',
    port: 443,
    path: '/1.1/search/tweets.json',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
    }
  };
  
  helper.getJSON(options, function(statusCode, result) {

    console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
    res.statusCode = statusCode;

    if (result.errors[0].code === 215) {
      res.send('No Twitter authorization.')
    } else {
      //res.render('search', { title: 'Search' });
      res.render('keyword', { title: keyword, tweets: tweets });
    }

  });
  
};
