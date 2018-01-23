var fs = require('fs');
var utmObj = require('utm-latlng');

module.exports.getCoord = function(req, res) {

  try {
    var data = fs.readFileSync('backend/functions/coord.json', 'utf8');
  } catch(e) {
      console.log('Error:', e.stack);
      res.send(500);
  }

  var utm_data = JSON.parse(data);

  var utm = new utmObj(); //Default Ellipsoid is 'WGS 84'

  coordinates = utm.convertUtmToLatLng(utm_data.easting, utm_data.northing, utm_data.zoneNum, utm_data.zoneLetter);

  coordinates.resolution = utm_data.resolution;

  coordinates.lat = coordinates.lat.toFixed(7);
  coordinates.lng = coordinates.lng.toFixed(7);
  coordinates.orthophotoWidth = utm_data.orthophotoWidth;
  // console.log('lat');
  // console.log(coordinates.lat);
  // console.log('long');
  // console.log(coordinates.lng);

  res.json(coordinates).send(200);
};
