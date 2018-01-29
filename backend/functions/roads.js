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

  try {
    var data = fs.readFileSync('backend/functions/roads.json', 'utf8');
  } catch(e) {
      console.log('Error:', e.stack);
      res.send(404);
  }

  var roads = JSON.parse(data);

  console.log(roads);

  res.json(roads).send(200);
};
