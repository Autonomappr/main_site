(function () {

  angular
    .module('autonomappr_app')
    .controller('homepageCtrl', homepageCtrl);

  homepageCtrl.$inject = ['$scope', 'dataGetter', 'graphics', 'roadManager', 'poiManager'];

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

  function rotate(x, y, x_c, y_c, rad) {
    var x_1 = x - x_c,
        y_1 = y - y_c;

    var x_2 = Math.cos(rad) * x_1 - Math.sin(rad) * y_1,
        y_2 = Math.sin(rad) * x_1 + Math.cos(rad) * y_1;

    return [x_2 + x_c, y_2 + y_c];
  }

  function getRotationRad(item) {
    var transform = item.css("-webkit-transform");

    if(transform !== 'none') {
        var values = transform.split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        var angle = Math.atan2(b, a);
    } else { var angle = 0; }

    // return (angle < 0) ? angle + 2*Math.PI : angle;
    return angle;
  }


  var NONE = 0, ROADS = 1, POI = 2;
  function homepageCtrl($scope, dataGetter, graphics, roadManager, poiManager) {
    var res = 1,
        photoOriginalWidth = 1,
        datumLat = 1,
        datumLon = 1,
        // roadArray = [],
        currentRoadID = -1,
        currentPointsID = -1,
        prevNode = null;

    $scope.clickLat = 2;
    $scope.clickLon = 3;
    $scope.roads = [];
    $scope.poiList = [];

    var clickAction = NONE;
    $scope.addRoadDisplay = 'Add a Road';
    $scope.addPOIDisplay = 'Add a POI';

    var mapOptions = {
      backgroundColor: '#232323',
      center: {lat: 43.475011, lng: -80.548040},
      clickableIcons: false,
      draggable: false,
      disableDoubleClickZoom: true,
      fullscreenControl: false,
      gestureHandling: 'none',
      gridlines: false,
      keyboardShortcuts: false,
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT,
        mapTypeIds: google.maps.MapTypeId.SATELLITE | google.maps.MapTypeId.ROADMAP,
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
      },
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      navigationControl: false,
      panControl: false,
      rotateControl: false,
      scaleControl: false,
      scrollwheel: false,
      streetViewControl: false,
      styles: mapStyles,
      zoom: 18,
      zoomControl: false,
    }

    var map = new google.maps.Map(document.getElementById('map'), mapOptions);
    map.setTilt(0);

    var refresh = function() {
      graphics.clearScreen();
      roadManager.refresh();
      poiManager.refresh();
    }

    geoData = dataGetter.getGeoRef().then(function (data) {
      datumLat = parseFloat(data.lat);
      datumLon = parseFloat(data.lng);
      res = parseFloat(data.resolution);
      photoOriginalWidth = parseFloat(data.orthophotoWidth);
    }, function(e) {
      console.log(e);
    });

    $("#orthophoto").on('load', function() {
      $scope.photoWidth = this.offsetWidth;
      $scope.photoHeight = this.offsetHeight;

      $('#glCanvas').attr('width', $scope.photoWidth);
      $('#glCanvas').attr('height', $scope.photoHeight);

      canvas = document.querySelector("#glCanvas");
      gl = canvas.getContext("webgl");

      // Only continue if WebGL is available and working
      if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
      }

      graphics.initGraphics(gl);
      roadManager.loadRoads().then(function (data) {
        var roads = data[0],
            colors = data[1],
            names = data[2];
        for(var i = 0; i < roads.length; i++) {
          var colorString = 'rgb(' + colors[i][0] + ',' + colors[i][1] + ',' +  colors[i][2] + ')'
          $scope.roads.push({
            id : roads[i],
            color : colorString,
            name : names[i]
          });
        }
      }, function () {});

      poiManager.loadPOI().then(function (data) {
        var poi = data[0],
            colors = data[1],
            names = data[2];

        for(var i = 0; i < poi.length; i++) {
          var colorString = 'rgb(' + colors[i][0] + ',' + colors[i][1] + ',' +  colors[i][2] + ')'
          $scope.poiList.push({
            id : poi[i],
            color : colorString,
            name : names[i]
          });
        }
      }, function () {});
    }).each(function() {
      if(this.complete) $(this).load();
    });

    $('#glCanvas').click(function (e) { //Relative ( to its parent) mouse position
      if(clickAction) {
        var left = parseInt($('#glCanvas').css("left"), 10),
            top = parseInt($('#glCanvas').css("top"), 10);

        var rad = -getRotationRad($('#glCanvas')),
            x_c = left + $scope.photoWidth / 2.0,
            y_c = top + $scope.photoHeight / 2.0;

        click = rotate(e.pageX, e.pageY, x_c, y_c, rad);

        click_X = (click[0] - left) / $scope.photoWidth;
        click_Y = (click[1] - top) / $scope.photoHeight;

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
          prevNode = roadManager.addPoint(prevNode, click_X, click_Y, currentRoadID);
          poiManager.refresh()
          // roadArray.push((click_X) / $scope.photoWidth);
          // roadArray.push(1.0 - (click_Y) / $scope.photoHeight);
          //
          // graphics.clearScreen();
          // graphics.drawRoadPoints(roadArray);
          // graphics.drawRoadLines(roadArray);
        } else if (clickAction == POI) {
          poiManager.addPoint(click_X, click_Y, currentPointsID);
          roadManager.refresh()
        }
      }
    });

    $scope.toggleRoadMode = function() {
      if(clickAction == POI) {
        $scope.togglePOIMode();
      }

      if (clickAction == NONE) {
        $('#addRoadBtn').removeClass('addButton');
        $('#addRoadBtn').addClass('doneButton');
        $scope.addRoadDisplay = 'Done';
        clickAction = ROADS;
        var data = roadManager.initRoad();
        currentRoadID = data[0];
        var colorString = 'rgb(' + data[1][0] + ',' + data[1][1] + ',' +  data[1][2] + ')';
        var name = 'New Road';
        $scope.roads.push({
          id: currentRoadID,
          color : colorString,
          name : name
        });
      } else {
        $('#addRoadBtn').removeClass('doneButton');
        $('#addRoadBtn').addClass('addButton');
        $('#r' + currentRoadID).prop('disabled', true);

        $scope.addRoadDisplay = 'Add a Road';
        clickAction = NONE;

        var index = $scope.roads.findIndex(x => x.id == currentRoadID);
        roadManager.rename(currentRoadID, $scope.roads[index].name)
        roadManager.saveRoads();
        refresh();
        currentRoadID = -1;
        prevNode = null;
      }
    }

    $scope.addToRoad = function (roadId) {
      $('#addRoadBtn').removeClass('addButton');
      $('#addRoadBtn').addClass('doneButton');
      $('#r' + roadId).prop('disabled', false);

      $scope.addRoadDisplay = 'Done';
      prevNode = null;
      currentRoadID = roadId;
      clickAction = ROADS;
    }

    $scope.removeRoad = function (roadId) {
      roadManager.removeRoad(roadId);

      var index = $scope.roads.findIndex(x => x.id == roadId);
      $scope.roads.splice(index, 1);
      refresh();
    }

    $scope.togglePOIMode = function() {
      if(clickAction == ROADS) {
        $scope.toggleRoadMode();
      }

      if (clickAction == NONE) {
        $('#addPOIBtn').removeClass('addButton');
        $('#addPOIBtn').addClass('doneButton');
        $scope.addPOIDisplay = 'Done';
        clickAction = POI;
        var data = poiManager.initPOI();
        currentPointsID = data[0];
        var colorString = 'rgb(' + data[1][0] + ',' + data[1][1] + ',' +  data[1][2] + ')';
        var name = 'New POI';
        $scope.poiList.push({
          id: currentPointsID,
          color: colorString,
          name : name
        });
      } else {
        $('#addPOIBtn').removeClass('doneButton');
        $('#addPOIBtn').addClass('addButton');
        $('#p' + currentPointsID).prop('disabled', true)
        $scope.addPOIDisplay = 'Add a POI';
        clickAction = NONE;

        var index = $scope.poiList.findIndex(x => x.id == currentPointsID);
        poiManager.rename(currentPointsID, $scope.poiList[index].name)
        poiManager.savePOI();
        refresh();
        currentPointsID = -1;
      }
    }

    $scope.addToPOI = function (pointsId) {
      $('#addPOIBtn').removeClass('addButton');
      $('#addPOIBtn').addClass('doneButton');
      $scope.addPOIDisplay = 'Done';
      currentPointsID = pointsId;
      clickAction = POI;

      $('#p' + currentPointsID).prop('disabled', false);
    }

    $scope.removePOI = function (pointsId) {
      poiManager.removePOI(pointsId);

      var index = $scope.poiList.findIndex(x => x.id == pointsId);
      $scope.poiList.splice(index, 1);
      refresh();
    }
  }

})();
