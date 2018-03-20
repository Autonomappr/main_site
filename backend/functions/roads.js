var fs = require('fs');

function isEmpty(obj) {
  for(var key in obj) {
    if(obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}


module.exports.update = function(req, res) {

  if(isEmpty(req.body.roadGraphs)) {
    fs.unlinkSync('backend/functions/roads.json');
  } else {
    var roads = JSON.stringify({
      roadGraphs : req.body.roadGraphs
    });

    fs.writeFile('backend/functions/roads.json', roads, 'utf8', function(err) {
      if(err) {
        console.log('Error:', e.stack);
        res.send(500);
      } else {
        res.send(200);
      }
    });
  }
};

module.exports.getRoads = function(req, res) {

  if (!fs.existsSync('backend/functions/roads.json')) {
    var roadsTmp = JSON.stringify({
      roadGraphs : {}
    });

    fs.writeFileSync('backend/functions/roads.json', roadsTmp, 'utf8');
  }

  var data = fs.readFileSync('backend/functions/roads.json', 'utf8');

  var roads = JSON.parse(data);

  res.json(roads);
};
