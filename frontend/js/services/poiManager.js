(function () {

  angular
    .module('autonomappr_app')
    .service('poiManager', poiManager);

  poiManager.$inject = ['$http', '$q', 'graphics'];

  const TOL = 0.02; // TIGHT
  // const TOL = 0.05; // LOOSE
  var currentMaxID = 0;
  var poiList = {},
      colorOptions = [
        [244, 67, 54],
        [17, 59, 197],
        [33, 150, 243],
        [0, 150, 136],
        [255, 235, 59],
        [255, 152, 0],
        [255, 87, 34],
        [233, 30, 99]
      ].map(function(x) { return x.map(function(y) { return (y / 255.0).toFixed(2); } ) });

  function withinTolerance(node1, node2) {
    var dist = Math.sqrt(Math.pow(node1[0] - node2[0], 2) + Math.pow(node1[1] - node2[1], 2));
    // console.log('Distance to prev node : ' + dist);
    return dist < TOL;
  }

  function setMaxID() {
    currentMaxID = 0;
    for(poi in poiList) {
      if(poiList[poi].id > currentMaxID) {
        currentMaxID = poiList[poi].id;
      }
    }
    currentMaxID += 1;
  }

  function poiManager($http, $q, graphics) {
    function initPOI() {
      var poi = {
        vertices : [],
        id : currentMaxID,
        color : colorOptions[Math.floor(Math.random() * colorOptions.length)],
        name : 'New POI'
      };

      poiList[poi.id] = poi;
      setMaxID();

      return [poi.id, poi.color.map(function(x) { return Math.floor(x * 255)})];
    }

    function addPoint(click_X, click_Y, pointsId) {
      var newNode = [click_X, 1.0 - click_Y],
          nodeExists = false;

      for (var i = 0; i < poiList[pointsId].vertices.length; i++) {
        if(withinTolerance(poiList[pointsId].vertices[i], newNode)) {
          newNode = poiList[pointsId].vertices[i];
          nodeExists = true;
          break;
        }
      }

      if (!nodeExists) {
        poiList[pointsId].vertices.push(newNode);
      }

      graphics.drawPOI(poiList);

      return
    }

    function savePOI() {
      var data = {
        poiList : poiList
      };

      $http({
        method : 'POST',
        url : '/api/poi/update',
        data : data,
        headers: {}
      }).then(
        function successCallback(response) {
          console.log('Saved POI');
        },
        function errorCallback(e) {
          console.log(e);
        }
      );
    }

    function loadPOI() {
      var defferred = $q.defer();
      $http({
        method : 'GET',
        url : '/api/poi',
        headers: {}
      }).then(
        function successCallback(response) {
          poiList = response.data.poiList;

          graphics.drawPOI(poiList);

          var pointsIds = Object.keys(poiList),
              poiColors = [],
              poiNames = [];

          for(pointsId in poiList) {
            poiColors.push(poiList[pointsId].color.map(function(x) { return Math.floor(x * 255.0); }));
            poiNames.push(poiList[pointsId].name);
          }
          setMaxID();

          defferred.resolve([pointsIds, poiColors, poiNames]);
        },
        function errorCallback(e) {
          console.log(e);
          defferred.reject();
        }
      );

      return defferred.promise;
    }

    function removePOI(pointsId) {
      delete poiList[pointsId];
      setMaxID();
      savePOI();
    }

    function refresh() {
      graphics.drawPOI(poiList);
    }

    function getPointsIds() { return Object.keys(poiList); }

    function rename(id, name) {
      poiList[id].name = name;
    }

    return {
      addPoint : addPoint,
      initPOI : initPOI,
      savePOI : savePOI,
      loadPOI : loadPOI,
      removePOI : removePOI,
      refresh : refresh,
      getPointsIds : getPointsIds,
      rename : rename
    };
  }
})();
