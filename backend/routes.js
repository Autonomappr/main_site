var express = require('express');
var router = express.Router();

var coord = require('./functions/coord.js');
var roads = require('./functions/roads.js');

// Coordinates
router.get('/datum', coord.getCoord);

// Roads
router.post('/roads/update', roads.update);
router.get('/roads', roads.getRoads);

// 404 error
router.all('/*', function(req, res) {
  res.status(404).send();
  return;
});

module.exports = router;
