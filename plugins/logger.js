var request = require('request');
var path = require('path');
var fs = require('fs');

var NerdieInterface = require('nerdie_interface.js');
var logDir;
var plugin;

function Logger(parentNerdie) {
  this.pluginInterface = new NerdieInterface(parentNerdie, this);
  this.logEnabled = false;
  plugin = this;
  logDir = "logs";

  if (parentNerdie.config.plugins.logger.enabled) {
    this.logEnabled = true;
  }

  if (parentNerdie.config.plugins.logger.dir) {
    logDir = parentNerdie.config.plugins.logger.dir;
    console.log("Logger plugin logging in " + logDir);
  }
}

Logger.prototype.init = function () {
  if (this.logEnabled) {
    this.pluginInterface.registerPattern(
      /.*/,
      this.logMessage
    );
    this.pluginInterface.userJoin( function(msg) {
      plugin.logJoined(msg);
    });
    this.pluginInterface.userLeave( function(msg) {
      plugin.logLeft(msg);
    });
  }
}

Logger.prototype.logMessage = function(msg) {
  plugin.writeToLog(msg.source, msg);
};

Logger.prototype.writeToLog = function (source, msg) {
  var now = new Date();
  var location = path.join(logDir, source);
  var file = path.join( location, now.strftime( '%Y-%m-%d.log' ) );
  path.exists( location, function( exists ) {
    var log;
    if (! exists ) {
      console.log("Logger plugin creating path: " + location);
      fs.mkdirSync( location, 0755 );
    }
    log = fs.createWriteStream ( file, { flags: 'a' });
    log.write( msg + '\n');
    log.end();
  });

};


Logger.prototype.logJoined = function (msg) {
  var time = plugin.getTimestamp();
  var out = time + ' ' + msg.user + " has joined " + msg.source;
  plugin.writeToLog(msg.source, out);
};

Logger.prototype.logLeft = function (msg) {
  var time = plugin.getTimestamp();
  var out = time + ' ' + msg.user + " has left " + msg.source;
  plugin.writeToLog(msg.source, out);
};

Logger.prototype.getTimestamp = function () {
  var date = new Date();
  var time = '[' + date.getHours() + ':' + date.getMinutes() + ']';

  return time;
};

module.exports = Logger;

