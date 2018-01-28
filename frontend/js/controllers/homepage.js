(function () {

  angular
    .module('autonomappr_app')
    .controller('homepageCtrl', homepageCtrl);

  homepageCtrl.$inject = ['$scope', 'dataGetter', 'graphics'];

  function convertToLatLon(lat, lon, x, y, res) {
    var R = 6371000.0; // metres

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

  function homepageCtrl($scope, dataGetter, graphics) {
    var res = 1,
        photoOriginalWidth = 1,
        datumLat = 1,
        datumLon = 1,
        pointArray = [];

    // $scope.photoWidth = 1;
    // $scope.photoHeight = 1;

    $scope.clickLat = 2;
    $scope.clickLon = 3;

    geoData = dataGetter.getGeoRef().then(function (data) {
      datumLat = parseFloat(data.lat);
      datumLon = parseFloat(data.lng);
      res = parseFloat(data.resolution);
      photoOriginalWidth = parseFloat(data.orthophotoWidth);
    }, function(e) {
      console.log(e);
    });

    $(document).ready(function () {
      $scope.photoWidth = document.getElementById('orthophoto').offsetWidth;
      $scope.photoHeight = document.getElementById('orthophoto').offsetHeight;

      $('#glCanvas').attr('width', $scope.photoWidth);
      $('#glCanvas').attr('height', $scope.photoHeight);


      canvas = document.querySelector("#glCanvas"),
      gl = canvas.getContext("webgl");

      // Only continue if WebGL is available and working
      if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
      }

      graphics.initGraphics(gl);
    });

    $('#glCanvas').click(function (e) { //Relative ( to its parent) mouse position
      var posX = $(this).offset().left,
          posY = $(this).offset().top;

      var click_X = e.pageX - posX - $scope.photoWidth * 0.5366858898,
          click_Y = e.pageY - posY - $scope.photoHeight * 0.4535090409,
          meters_per_pixel = res * ($scope.photoWidth / photoOriginalWidth);

      var coords = convertToLatLon(datumLat, datumLon, click_X, click_Y, meters_per_pixel);

      $scope.clickLat = coords[0].toFixed(6);
      $scope.clickLon = coords[1].toFixed(6);

      $scope.$apply();

      pointArray.push((e.pageX - posX) / $scope.photoWidth);
      pointArray.push(1.0 - (e.pageY - posY) / $scope.photoHeight);

      graphics.clearScreen();
      graphics.drawRoadPoints(pointArray);
      graphics.drawRoadLines(pointArray);
    });

  }

})();
