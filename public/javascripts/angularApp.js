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
      controller: 'MainCtrl'
    })

    .state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html', 
      controller: 'PostsCtrl'
    });

  $urlRouterProvider.otherwise('home');
}]);

/* Create a Factory for posts so we can access it anywhere, and only have on copy */
app.factory('posts', [function() {
  var o = {
    posts: []
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
    $scope.posts.push({
      title: $scope.title, 
      link: $scope.link, 
      upvotes: 4, 
      comments: [{author: 'Joe', body: 'Cool Post!', upvotes: 0}, {author: 'Bob', body: 'Great idea, but everything is wrong!', upvotes: 0}]
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


