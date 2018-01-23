(function () {

  angular
    .module('autonomappr_app')
    .controller('homepageCtrl', homepageCtrl);

  homepageCtrl.$inject = ['$scope', 'dataGetter'];

  function convertToLatLon(lat, lon, x, y, res) {
    var R = 6371000.0; // metres

    console.log(x);
    console.log(y);

    var d = Math.sqrt(x*x + y*y) / res;
    var bearing = Math.atan2(x, -y);

    lat = lat/180.0 * Math.PI;
    lon = lon/180.0 * Math.PI;

    var newLat = Math.asin( Math.sin(lat)*Math.cos(d/R) + Math.cos(lat)*Math.sin(d/R)*Math.cos(bearing) );
    var newLon = lon + Math.atan2(Math.sin(bearing)*Math.sin(d/R)*Math.cos(lat), Math.cos(d/R)-Math.sin(lat)*Math.sin(newLat));

    newLat = newLat * 180 / Math.PI;
    newLon = newLon * 180 / Math.PI;

    return [newLat, newLon];
  }

  function homepageCtrl($scope, dataGetter) {
    var res = 1;
    var orthophotoWidth = 1;

    geoData = dataGetter.getGeoRef().then(function (data) {
      $scope.lat = parseFloat(data.lat);
      $scope.lon = parseFloat(data.lng);
      res = parseFloat(data.resolution);
      orthophotoWidth = parseFloat(data.orthophotoWidth);
    }, function(e) {
      console.log(e);
    });

    $('#orthophoto').click(function (e) { //Relative ( to its parent) mouse position
      var posX = $(this).offset().left,
          posY = $(this).offset().top,
          w = this.width,
          h = this.height;

      var coords = convertToLatLon($scope.lat, $scope.lon, e.pageX - posX - w * 0.5366858898, e.pageY - posY - h * 0.4535090409, res * (w / orthophotoWidth) );

      $scope.lat2 = coords[0];
      $scope.lon2 = coords[1];

      $scope.$apply()
    });
  }

})();
