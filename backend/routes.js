var express = require('express');
var router = express.Router();

var coord = require('./functions/coord.js');

router.get('/datum', coord.getCoord);

// 404 error
router.all('/*', function(req, res) {
  res.status(404).send();
  return;
});

module.exports = router;
