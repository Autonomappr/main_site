var fs = require('fs');
var utmObj = require('utm-latlng');

module.exports.getCoord = function(req, res) {

  if(!fs.existsSync('backend/functions/poi.json')) {
    var poiTmp = JSON.stringify({
      poiList : {}
    });

    fs.writeFileSync('backend/functions/poi.json', poiTmp, 'utf8');
  }

  if (fs.existsSync('backend/functions/coord.json')) {
    // Default Aukerman Data Set Params
    var coordTmp = JSON.stringify({
      "zoneNum" : 17,
      "zoneLetter": "N",
      "easting" : 437036,
      "northing" : 4572789,
      "resolution" : 20,
      "orthophotoWidth" : 7682
    });

    fs.writeFileSync('backend/functions/poi.json', poiTmp, 'utf8');
  }

  var data = fs.readFileSync('backend/functions/coord.json', 'utf8');
  var utm_data = JSON.parse(data);

  var utm = new utmObj(); //Default Ellipsoid is 'WGS 84'

  coordinates = utm.convertUtmToLatLng(utm_data.easting, utm_data.northing, utm_data.zoneNum, utm_data.zoneLetter);

  coordinates.resolution = utm_data.resolution;

  coordinates.lat = coordinates.lat.toFixed(7);
  coordinates.lng = coordinates.lng.toFixed(7);
  coordinates.orthophotoWidth = utm_data.orthophotoWidth;

  res.json(coordinates);
};

module.exports.setCoord = function(req, res) {

  // console.log(req.body);
  var coordTmp = JSON.stringify({
    "zoneNum" : req.body.zoneNum,
    "zoneLetter": req.body.zoneLetter,
    "easting" : req.body.easting,
    "northing" : req.body.northing,
    "resolution" : req.body.resolution,
    "orthophotoWidth" : req.body.orthophotoWidth
  });

  fs.writeFileSync('backend/functions/coord.json', coordTmp, 'utf8');

  res.send(200);
};
