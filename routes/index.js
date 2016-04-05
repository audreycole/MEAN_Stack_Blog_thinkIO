var express = require('express');
var jwt = require('express-jwt');
var router = express.Router();
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* require mongoose to access database */
var mongoose = require('mongoose');
var passport = require('passport');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

/* POST route for registering as a user */
router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});

/* POST route for logging in a user */
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

/* GET request for all of our posts */
router.get('/posts', function(request, response, next){
	Post.find(function(err, posts) {
		if(err) { next(err); }
		// take result and send it back to client in json format
		response.json(posts); 
	})
});

/* POST route for posting posts */
router.post('/posts', auth, function(request, response, next) {
	var post = new Post(request.body);
	post.author = request.payload.username;

	// Try to save post to database
	post.save(function(err, post) {
		if(err) { return next(err); }

		response.json(post);
	})
});

/* Use param to load an object when it's in the URL --> load all of the posts beforehand */
router.param('post', function(request, response, next, id) {
	var query = Post.findById(id);

	query.exec(function(err, post) {
		if(err) { return next(err); }
		// If the post isn't there, create an error for it
		if(!post) { return next(new Error("can't find post!")); }

		request.post = post;
		return next();
	})
});

/* Use param to load an object when it's in the URL --> load all of the comments beforehand */
router.param('comment', function(request, response, next, id) {
	var query = Comment.findById(id);

	query.exec(function(err, comment) {
		if(err) { return next(err); }
		// If the comment isn't there, create an error for it
		if(!comment) { return next(new Error("can't find comment!")); }

		request.comment = comment;
		return next();
	})
});

/* GET request for returning a single post */
router.get('/posts/:post', function(request, response) {
	/* use populate method to grab comments for posts as well */
	request.post.populate('comments', function(err, post) {
		response.json(post);
	});
});

/* PUT an upvote on for a post */
router.put('/posts/:post/upvote', auth, function(request, response, next) {
	request.post.upvote(function(err, post) {
		if(err) { return next(err); }
		response.json(post);
	})
});

/* PUT an upvote on for a comment */
router.put('/posts/:post/comments/:comment/upvote', auth, function(request, response, next) {
	//console.log(request.params.post + " " + request.params.comment);

	request.comment.upvote(function(err, comment) {
		if(err) { return next(err); }
		response.json(comment);
	});
});

/* POST a comment */
router.post('/posts/:post/comments', auth, function(request, response, next) {
	var comment = new Comment(request.body);
	comment.post = request.post;
	comment.author = request.payload.username;

	comment.save(function(err, comment) {
		if(err) { return next(err); }

		request.post.comments.push(comment); // Add it to the current list of comments for this post
		request.post.save(function(err, post) { // Save to database
			if(err) { return next(err); }
			// Return the new comment we posted
			response.json(comment);
		});
	});
});

module.exports = router;
