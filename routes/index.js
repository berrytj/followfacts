

var helper = require('../helper');


exports.keyword = function(req, res) {
  
  var keyword = req.body.keyword;
  var options = helper.getOptions(keyword);
  
  helper.getJSON(options, function(statusCode, result) {

    console.log(result);
    //console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));

    res.statusCode = statusCode;

    var tweets = [ 'hey', 'ho', 'holla', 'doh' ];

    res.render('keyword', { title: keyword, tweets: tweets });

  });
  
};


exports.search = function(req, res) {
    res.render('search', { title: 'Search' });
};








