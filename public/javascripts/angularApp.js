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
      controller: 'PostsCtrl'
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
  }

  /* Create a post that will be added to our database (POST '/posts') */
  o.create = function(post) {
    return $http.post('/posts', post).success(function(data) { // POST to database
      o.posts.push(data); // add this to current lists of posts
    }) 
  }

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
    post.upvotes += 1;
  }

}]);

/*Posts Controller */
app.controller('PostsCtrl', ['$scope', '$stateParams','posts', 

function($scope, $stateParams, posts) {
  $scope.post = posts.posts[$stateParams.id];

  $scope.addComment = function(){
    if($scope.body == "") {return;}
    $scope.post.comments.push({
      body: $scope.body, 
      author: 'user', 
      upvotes: 0, 
    });
    $scope.body = ''; // Reset to empty string
  }

  $scope.incrementUpvotes = function(comment) {
    comment.upvotes += 1;
  }
  
}]);


