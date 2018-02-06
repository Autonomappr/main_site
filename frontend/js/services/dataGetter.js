(function () {

  angular
    .module('autonomappr_app')
    .service('dataGetter', dataGetter);

  dataGetter.$inject = ['$http', '$q'];

  function dataGetter($http, $q) {
    var getGeoRef = function () {
      var deferred = $q.defer();
      $http({
        method : 'GET',
        url : '/api/params',
        headers: {}
      }).then(
        function successCallback(response) {
          deferred.resolve(response.data);
        },
        function errorCallback(e) {
          console.log(e);
          deferred.reject(error);
        }
      );

      return deferred.promise;
    }

    return {
      getGeoRef : getGeoRef
    };
  }
})();
