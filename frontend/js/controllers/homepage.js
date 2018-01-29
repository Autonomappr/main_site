(function () {

  angular
    .module('autonomappr_app')
    .controller('homepageCtrl', homepageCtrl);

  homepageCtrl.$inject = ['$scope', 'dataGetter', 'graphics', 'roadManager'];

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

  var NONE = 0, ROADS = 1, POIS = 2;
  function homepageCtrl($scope, dataGetter, graphics, roadManager) {
    var res = 1,
        photoOriginalWidth = 1,
        datumLat = 1,
        datumLon = 1,
        roadArray = [],
        curentRoadID = -1,
        prevNode = null;

    $scope.clickLat = 2;
    $scope.clickLon = 3;
    $scope.roads = [];

    $scope.test = 1;

    var clickAction = NONE;
    $scope.addRoadDisplay = 'Add a Road';

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

      $('#mapOverlay').css('width', $scope.photoWidth);
      $('#mapOverlay').css('height', $scope.photoHeight);

      canvas = document.querySelector("#glCanvas"),
      gl = canvas.getContext("webgl");

      // Only continue if WebGL is available and working
      if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
      }

      graphics.initGraphics(gl);
      roadManager.loadRoads().then(function (data) {
        var roads = data[0],
            colors = data[1];
        for(var i = 0; i < roads.length; i++) {
          var colorString = 'rgb(' + colors[i][0] + ',' + colors[i][1] + ',' +  colors[i][2] + ')'
          $scope.roads.push({
            id : roads[i],
            color : colorString
          });
        }
      }, function () {});
    });

    $('#glCanvas').click(function (e) { //Relative ( to its parent) mouse position
      if(clickAction) {
        var posX = $(this).offset().left,
            posY = $(this).offset().top;

        var click_X = (e.pageX - posX),
            click_Y = (e.pageY - posY);

        // var click_X = e.pageX - posX - $scope.photoWidth * 0.5366858898,
        //     click_Y = e.pageY - posY - $scope.photoHeight * 0.4535090409,
        //     meters_per_pixel = res * ($scope.photoWidth / photoOriginalWidth);
        //
        // var coords = convertToLatLon(datumLat, datumLon, click_X, click_Y, meters_per_pixel);
        //
        // $scope.clickLat = coords[0].toFixed(6);
        // $scope.clickLon = coords[1].toFixed(6);
        // $scope.$apply();

        if(clickAction == ROADS) {
          prevNode = roadManager.addPoint(prevNode, click_X / $scope.photoWidth, click_Y / $scope.photoHeight, curentRoadID);

          // roadArray.push((click_X) / $scope.photoWidth);
          // roadArray.push(1.0 - (click_Y) / $scope.photoHeight);
          //
          // graphics.clearScreen();
          // graphics.drawRoadPoints(roadArray);
          // graphics.drawRoadLines(roadArray);
        }
      }
    });

    $scope.toggleRoadMode = function() {
      if (clickAction == NONE) {
        $('#addRoadBtn').removeClass('btn-success');
        $('#addRoadBtn').addClass('btn-warning');
        $scope.addRoadDisplay = 'Done';
        clickAction = ROADS;
        var data = roadManager.initRoad();
        curentRoadID = data[0];
        var colorString = 'rgb(' + data[1][0] + ',' + data[1][1] + ',' +  data[1][2] + ')';

        $scope.roads.push({
          id: curentRoadID,
          color: colorString
        });
        console.log($scope.roads);
      } else {
        $('#addRoadBtn').removeClass('btn-warning');
        $('#addRoadBtn').addClass('btn-success');
        $scope.addRoadDisplay = 'Add a Road';
        clickAction = NONE;
        roadManager.saveRoads();
        curentRoadID = -1;
        prevNode = null;
      }
    }

    $scope.addToRoad = function (roadId) {
      $('#addRoadBtn').removeClass('btn-success');
      $('#addRoadBtn').addClass('btn-warning');
      $scope.addRoadDisplay = 'Done';
      prevNode = null;
      console.log(roadId);
      curentRoadID = roadId;
      clickAction = ROADS;
    }

    $scope.removeRoad = function (roadId) {
      roadManager.removeRoad(roadId);

      var index = $scope.roads.findIndex(x => x.id == roadId);
      $scope.roads.splice(index, 1);
      roadManager.refresh();
    }

  }

})();
