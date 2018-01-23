(function () {
  var app = angular.module('autonomappr_app', ['ngRoute']);

  var apiUrl = 'http://localhost:8081/api';

  // var app = angular.module('autonomappr_app');

  function config ($routeProvider, $locationProvider) {
      $routeProvider
      .when('/', {
        templateUrl: 'partials/homepage.html',
        controller: 'homepageCtrl'
      })
      .otherwise({redirectTo: '/'});

      $locationProvider.html5Mode(true);

    }

  angular
      .module('autonomappr_app')
      .config(['$routeProvider', '$locationProvider', config]);

})();
