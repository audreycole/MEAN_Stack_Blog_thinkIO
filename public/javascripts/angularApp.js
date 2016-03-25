// Include 'ui.router' as a dependency to the app, (we included the src in index.html)
var app = angular.module('Blog', ['ui.router']);

/* Configuration */
app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      // Load posts before page loads
      resolve: {
        postPromise: ['posts', function(posts) {
          return posts.getAll();
        }]
      }
    })

    .state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html', 
      controller: 'PostsCtrl',
      // Load comments before page loads
      resolve: {
        post: ['$stateParams', 'posts', function($stateParams, posts) {
          return posts.get($stateParams.id);
        }]
      }
    });

  $urlRouterProvider.otherwise('home');
}]);

/* Create a Factory for posts so we can access it anywhere, and only have on copy */
app.factory('posts', ['$http', function($http) {
  var o = {
    posts: []
  }

  /* Load all of the posts (GET '/posts') by hitting the server and then coming back and returning result to us */
  o.getAll = function() {
    return $http.get('/posts').success(function(data) {
      angular.copy(data, o.posts); // copy data into o.posts
    });
  };

  /* GET one post by id (from mongodb, not index in array anymore) */
  o.get = function(id) {
    return $http.get('/posts/' + id).then(function(response) {
      return response.data;
    });
  };

  /* Create a post that will be added to our database (POST '/posts') */
  o.create = function(post) {
    return $http.post('/posts', post).success(function(data) { // POST to database
      o.posts.push(data); // add this to current lists of posts
    }); 
  };

  /* Upvote a post (make call to database) */
  o.upvote = function(post) {
    return $http.put('/posts/' + post._id + '/upvote').success(function(data) {
      post.upvotes += 1;
    });
  };

  /* Add a comment (make POST to database) */
  o.addComment = function(id, comment) {
    return $http.post('/posts/' + id + '/comments', comment);
  };

  /* Upvote a comment (make call to database) */
  o.upvoteComment = function(post, comment) {
    //console.log("id: " + comment._id);
    //console.log("url: " + '/posts/' + post._id + '/comments/' + comment._id + '/upvote');
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote').success(function(data){
      comment.upvotes += 1;
    });
  };

  return o;
}]);


/* Controllers should be used purely to wire up services, dependencies and other objects, 
 and assign them to the view via scope. */
app.controller('MainCtrl', ['$scope', 'posts',

function($scope, posts){

  $scope.posts = posts.posts; // get posts key in hash of posts factory

  //Create a $scope function that will add an object into the posts array (through posts service)
  $scope.addPost = function(){
    if($scope.title == "") {return;}
    /*$scope.posts.push({
      title: $scope.title, 
      link: $scope.link, 
      upvotes: 4, 
      comments: [{author: 'Joe', body: 'Cool Post!', upvotes: 0}, {author: 'Bob', body: 'Great idea, but everything is wrong!', upvotes: 0}]
    });*/

    // Call create function to hit database 
    posts.create({
      title: $scope.title,
      link: $scope.link
    });
    $scope.title = ''; // Reset to empty string
    $scope.link = '';
  }

  $scope.incrementUpvotes = function(post) {
    //post.upvotes += 1;
    posts.upvote(post); // Call upvote function to hit database
  }

}]);

/*Posts Controller */
// Add in post so we can access post database methods
app.controller('PostsCtrl', ['$scope', '$stateParams','posts', 'post',

function($scope, $stateParams, posts, post) {
  
  //$scope.post = posts.posts[$stateParams.id];
  $scope.post = post;

  $scope.addComment = function(){
    if($scope.body == "") {return;}
    /*$scope.post.comments.push({
      body: $scope.body, 
      author: 'user', 
      upvotes: 0, 
    });*/
    // Call addComment function to make POST to database
    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user',
    }).success(function(comment) {
      $scope.post.comments.push(comment);
    });

    $scope.body = ''; // Reset to empty string
  };

  $scope.incrementUpvotes = function(comment) {
    //comment.upvotes += 1;
    //console.log(comment);
    posts.upvoteComment($scope.post, comment);
  };
  
}]);


