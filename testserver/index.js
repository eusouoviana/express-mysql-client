var express = require('express');
var app = express();
var mysql = require('mysql');

var nodeadmin = require(__dirname + '/../middleware/index.js');

app.use(nodeadmin(app, {
  defaultHost: 'localhost:3303',
  defaultUserName: '',
  defaultPassword: '',
  allowedIpList: '127.0.0.1',
}));

app.use('/', function (req, res, next) {
  res.redirect('/myadmin');
});

app.listen(process.env.PORT || 4040);

module.exports = app;
