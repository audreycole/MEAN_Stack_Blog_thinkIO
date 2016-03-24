var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* require mongoose to access database */
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

/* GET request for all of our posts */
router.get('/posts', function(request, response, next){
	Post.find(function(err) {
		if(err) { next(err); }
		// take result and send it back to client in json format
		response.json(posts); 
	})
});

/* POST route for posting posts */
router.post('/posts', function(request, response, next) {
	var post = new Post(request.body);

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

	query.exec(function(err, post) {
		if(err) { return next(err); }
		// If the post isn't there, create an error for it
		if(!post) { return next(new Error("can't find comment!")); }

		request.post = post;
		return next();
	})
});

/* GET request for returning a single post */
router.get('/posts/:post', function(request, response) {
	response.json(request.post);
});

/* PUT an upvote on for a post */
router.put('/posts/:post/upvote', function(request, response, next) {
	request.post.upvote(function(err, post) {
		if(err) { return next(err); }
		response.json(post);
	})
});

/* PUT an upvote on for a comment */
router.put('/posts/:post/comments/:comment/upvote', function(request, response, next) {
	request.comment.upvote(function(err, comment) {
		if(err) { return next(err); }
		response.json(comment);
	})
});

/* POST a comment */
router.post('/posts/:post/comments', function(request, response, next) {
	var comment = new Comment(request.body);
	comment.post = request.post;

	comment.save(function(err, comment) {
		if(err) { return next(err); }

		request.post.comments.push(comment);
		request.post.save(function(err, post) {
			if(err) { return next(err); }

			response.json(comments);
		});
	});
});

module.exports = router;
