var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
	title: String, 
	link: String,
	author: String,
	upvotes: {type: Number, default: 0},
	comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]
});

/* Upvote method */
PostSchema.methods.upvote = function(callback) {
	this.upvotes += 1;
	this.save(callback);
}

mongoose.model('Post', PostSchema);