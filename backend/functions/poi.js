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

  if(isEmpty(req.body.poiList)) {
    fs.unlinkSync('backend/functions/poi.json');
  } else {
    var poi = JSON.stringify({
      poiList : req.body.poiList
    });

    fs.writeFile('backend/functions/poi.json', poi, 'utf8', function(err) {
      if(err) {
        console.log('Error:', e.stack);
        res.status(500).send();
      } else {
        res.status(200).send();
      }
    });
  }
};

module.exports.getPOIList = function(req, res) {

  if(!fs.existsSync('backend/functions/poi.json')) {
    var poiTmp = JSON.stringify({
      poiList : {}
    });

    fs.writeFileSync('backend/functions/poi.json', poiTmp, 'utf8');
  }

  var data = fs.readFileSync('backend/functions/poi.json', 'utf8');

  var poiList = JSON.parse(data);

  res.json(poiList);
};
