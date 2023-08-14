angular.module('nodeadmin.auth', [])

  .controller('AuthController', ['$scope', '$window', '$http', '$state', '$timeout', 'Auth', function ($scope, $window, $http, $state, $timeout, Auth) {
    $scope.user = {};

    $http.get('api/options')
      .then(function (response) {
        $timeout(function () {
          $scope.user.mysqlHost = response.data.defaultHost;
          $scope.user.mysqlUser = response.data.defaultUserName;
          $scope.user.mysqlPassword = response.data.defaultPassword;
          $scope.$apply(); // Refresh the HTML
          console.log('refresh')
        })
      })
      .catch(function (error) {
        // Handle error
        $scope.error = error.data.error;
        console.error(error);
      });

    $scope.login = function () {
      Auth.login($scope.user)
        .then(function (token) {
          // Store session token
          $window.localStorage.setItem('nodeadmin', token);
          if (token) {
            $state.transitionTo('home');
          }
        })
        .catch(function (err) {
          console.error(err.data.error);
          console.error(err.data);
          // Allow for error displaying on login page
          $scope.error = err.data.error;
        });
    };

    $scope.logout = function () {
      $window.localStorage.removeItem('nodeadmin');
      $state.transitionTo('login');
    };

  }]);
