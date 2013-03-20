
// Create request token to access Twitter API.  Help from:
// http://moonlitscript.com/post.cfm/how-to-use-oauth-and-twitter-in-your-node-js-expressjs-app/
exports.auth = function(req, res){

	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {

		if (error) {

			console.log(error);
			res.send('Failed to authorize.');

		} else {

			console.log(req);
			req.session.oauth = {};
			req.session.oauth.token = oauth_token;
			console.log('oauth.token: ' + req.session.oauth.token);
			req.session.oauth.token_secret = oauth_token_secret;
			console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
			res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);

		}

	});

};

// Callback after Twitter verification to create access token.
// Twitter API version 1.1 requires OAuth for all API calls.
exports.auth_callback = function(req, res, next){

	if (req.session.oauth) {

		req.session.oauth.verifier = req.query.oauth_verifier;
		var oauth = req.session.oauth;

		oa.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
			function(error, oauth_access_token, oauth_access_token_secret, results) {

				if (error) {

					console.log(error);
					res.send('Authorization error.');

				} else {

					req.session.oauth.access_token = oauth_access_token;
					req.session.oauth.access_token_secret = oauth_access_token_secret;
					console.log(results);
					//res.render('search', { title: 'Search' });
					res.redirect('/keyword/house');

				}
			}
		);

	} else {
		next(new Error("You're not supposed to be here."));
	}

};