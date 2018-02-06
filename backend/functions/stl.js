module.exports.get = function (req, res) {
  res.sendFile('/data/test.stl', { root: __dirname });
}
