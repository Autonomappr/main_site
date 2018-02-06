var express = require('express');
var router = express.Router();

var coord = require('./functions/coord.js');
var roads = require('./functions/roads.js');
var poi = require('./functions/poi.js');
var stl = require('./functions/stl.js');

// Coordinates
router.get('/params', coord.getCoord);
router.post('/params/set', coord.setCoord);

// Roads
router.post('/roads/update', roads.update);
router.get('/roads', roads.getRoads);

// POI
router.post('/poi/update', poi.update);
router.get('/poi', poi.getPOIList);

// Coordinates
router.get('/stl', stl.get);

// 404 error
router.all('/*', function(req, res) {
  res.status(404).send();
  return;
});

module.exports = router;
