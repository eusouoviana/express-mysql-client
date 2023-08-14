var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var sock = require('socket.io');
var fs = require('fs');
var randomstring = require('randomstring')

// *** myadmin Routers ***
var auth = require('./auth/authroutes.js');
var database = require('./database/databaseroutes.js');
var settings = require('./settings/settingsroutes.js');
var system = require('./system/systemroutes.js');
var home = require('./home/homeroutes.js');

module.exports = function myadmin(app, options) {
  'use strict';

  const params = {
    httpRoutePrefix: options.httpRoutePrefix ||
      process.env.MYSQL_EXPRESS_ROUTE_PREFIX ||
      'myadmin',

    defaultHost: options.defaultHost ||
      process.env.MYSQL_EXPRESS_DEFAULT_HOSTNAME ||
      'localhost:3000',

    defaultUserName: options.defaultUserName ||
      process.env.MYSQL_EXPRESS_DEFAULT_USERNAME ||
      'root',

    defaultPassword: options.defaultPassword ||
      process.env.MYSQL_EXPRESS_DEFAULT_PASSWORD ||
      'root',

    allowedIpList: options.allowedIpList ||
      process.env.MYSQL_EXPRESS_IP_LIST ||
      '',
  }

  var ips = params.allowedIpList.replace(/\s+/g, '').split(',');

  // ** Socket Connection
  var server = http.createServer(app);
  var io = sock(server);

  app.listen = server.listen.bind(server);

  // ** Socket Controller
  require('./sockets/socketcontroller.js')(io);

  // ** Logs
  var accessLogStream = fs.createWriteStream(__dirname + '/serverlogs/access.log', { flags: 'a' });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  if (ips.length > 0) {
    ips.push('::1', '127.0.0.1');

    app.use(function (req, res, next) {
      var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (ips.indexOf(ip) > -1) {
        next();
      } else {
        res.status(401).send('Unauthorized');
      }
    });
  }

  // Custom middleware to set global variables
  app.use(function (req, res, next) {
    res.locals.clientParams = params;
    next();
  });

  app.use('/' + params.httpRoutePrefix, express.static(__dirname + '/public'));

  fs.readFile('./secret.js', function (err, data) {
    if (err.code === 'ENOENT') {
      var randomString = randomstring.generate();
      var contents = "module.exports = '" + randomString + "';";
      fs.writeFileSync(__dirname + '/secret.js', contents);
    }
    var secret = require('./secret.js');
    app.locals.secret = secret;
  });

  // ** Routes
  app.get('/' + params.httpRoutePrefix + '/api/options', function (req, res) {
    res.status(200).json(params)
  });

  app.use('/' + params.httpRoutePrefix + '/api/auth', auth);
  app.use('/' + params.httpRoutePrefix + '/api/db', database);
  app.use('/' + params.httpRoutePrefix + '/api/settings', settings);
  app.use('/' + params.httpRoutePrefix + '/api/system', system);
  app.use('/' + params.httpRoutePrefix + '/api/home', home);

  // ** Middleware
  return function myadmin(req, res, next) {
    next();
  };
};
