(function () {

  angular
    .module('autonomappr_app')
    .service('roadManager', roadManager);

  roadManager.$inject = ['$http', '$q', 'graphics'];

  // const TOL = 0.02; // TIGHT
  const TOL = 0.05; // LOOSE
  var roadGraphs = {},
      colorOptions = [
        [244, 67, 54],
        [156, 39, 176],
        [33, 150, 243],
        [0, 150, 136],
        // [76, 175, 80],
        [255, 235, 59],
        [255, 152, 0],
        [255, 87, 34],
        [255, 255, 255],
        [233, 30, 99]
      ].map(function(x) { return x.map(function(y) { return (y / 255.0).toFixed(2); } ) });

  function withinTolerance(node1, node2) {
    var dist = Math.sqrt(Math.pow(node1[0] - node2[0], 2) + Math.pow(node1[1] - node2[1], 2));
    // console.log('Distance to prev node : ' + dist);
    return dist < TOL;
  }

  function roadManager($http, $q, graphics) {
    function initRoad() {
      var road = {
        vertices : [],
        edges : [],
        id : new Date().getTime() % 10E3,
        color : colorOptions[Math.floor(Math.random() * colorOptions.length)]
      };

      roadGraphs[road.id] = road;

      return [road.id, road.color.map(function(x) { return Math.floor(x * 255)})];
    }

    function addPoint(prevNode, click_X, click_Y, roadId) {
      var newNode = [click_X, 1.0 - click_Y],
          nodeExists = false;

      for (var i = 0; i < roadGraphs[roadId].vertices.length; i++) {
        if(withinTolerance(roadGraphs[roadId].vertices[i], newNode)) {
          newNode = roadGraphs[roadId].vertices[i];
          nodeExists = true;
          break;
        }
      }

      if (!nodeExists) {
        roadGraphs[roadId].vertices.push(newNode);
      }

      if(prevNode != null) {
        roadGraphs[roadId].edges.push([prevNode, newNode]);
      }
      graphics.clearScreen();
      graphics.drawRoads(roadGraphs);

      return newNode;
    }

    function saveRoads() {
      var data = {
        roadGraphs : roadGraphs
      };

      $http({
        method : 'POST',
        url : '/api/roads/update',
        data : data,
        headers: {}
      }).then(
        function successCallback(response) {
          console.log('Saved Roads');
        },
        function errorCallback(e) {
          console.log(e);
        }
      );
    }

    function loadRoads() {
      var defferred = $q.defer();
      $http({
        method : 'GET',
        url : '/api/roads',
        headers: {}
      }).then(
        function successCallback(response) {
          roadGraphs = response.data.roadGraphs;

          graphics.clearScreen();
          graphics.drawRoads(roadGraphs);

          var roadIds = Object.keys(roadGraphs),
              roadColors = [];

          for(roadId in roadGraphs) {
            roadColors.push(roadGraphs[roadId].color.map(function(x) { return Math.floor(x * 255.0); }));
          }

          defferred.resolve([roadIds, roadColors]);
        },
        function errorCallback(e) {
          console.log(e);
          defferred.reject();
        }
      );

      return defferred.promise;
    }

    function removeRoad(roadId) {
      delete roadGraphs[roadId];
      saveRoads();
    }

    function refresh() {
      graphics.clearScreen();
      graphics.drawRoads(roadGraphs);
    }

    function getRoadIds() { return Object.keys(roadGraphs); }

    return {
      addPoint : addPoint,
      initRoad : initRoad,
      saveRoads : saveRoads,
      loadRoads : loadRoads,
      removeRoad : removeRoad,
      refresh : refresh,
      getRoadIds : getRoadIds
    };
  }
})();
