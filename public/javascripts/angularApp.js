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
    })

    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });

  $urlRouterProvider.otherwise('home');
}]);

/* Create a Factory for authenticating users */
app.factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};

  auth.saveToken = function (token){
    $window.localStorage['blog-token'] = token;
  };

  auth.getToken = function (){
    return $window.localStorage['blog-token'];
  }

  auth.isLoggedIn = function(){
    var token = auth.getToken();

    if(token){
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user){
    return $http.post('/register', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(user){
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function(){
    $window.localStorage.removeItem('blog-token');
  };

  return auth;
}]);

/* Create a Factory for posts so we can access it anywhere, and only have on copy */
app.factory('posts', ['$http', 'auth', function($http, auth) {
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
    return $http.post('/posts', post, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      o.posts.push(data);
    });
  };

  o.upvote = function(post) {
    return $http.put('/posts/' + post._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      post.upvotes += 1;
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/posts/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };

  o.upvoteComment = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      comment.upvotes += 1;
    });
  };

  return o;
}]);

/* Create a Controller that deals with authentication */
app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}]);

/* Create a Controller for a nav-bar to have at the top */
app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);


/* Controllers should be used purely to wire up services, dependencies and other objects, 
 and assign them to the view via scope. */
app.controller('MainCtrl', ['$scope', 'posts', 'auth',

function($scope, posts, auth){

  $scope.isLoggedIn = auth.isLoggedIn;

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
app.controller('PostsCtrl', ['$scope', '$stateParams','posts', 'post', 'auth',

function($scope, $stateParams, posts, post, auth) {
  
  $scope.isLoggedIn = auth.isLoggedIn;
  
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


