var path = require('path');
var fs = require('fs');
var NerdieInterface = require('nerdie_interface.js');


var Logger = function(parentNerdie) {

  // Private variables
  var that            = {};
  var pluginInterface = new NerdieInterface(parentNerdie, that);
  var logEnabled      = false;
  var logDir          = "logs";
  var enabledChannels = [];

  if (parentNerdie.config.plugins.logger.enabled) {
    logEnabled = true;
  }

  if (parentNerdie.config.plugins.logger.dir) {
    logDir = parentNerdie.config.plugins.logger.dir;
    console.log("Logger plugin logging in " + logDir);
  }

  if (parentNerdie.config.plugins.logger.channels) {
    enabledChannels = parentNerdie.config.plugins.logger.channels;
    console.log("Logging channels: " + enabledChannels);
  }


  function isEnabledForSource(source) {
    if (enabledChannels.indexOf(source) > -1) {
      return true;
    }

    return false;
  }

  function getTimestamp() {
    var date    = new Date();
    var hours   = date.getHours();
    var minutes = date.getMinutes();

    if (hours < 10) {
      hours = '0' + hours;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    var time = '[' + hours + ':' + minutes + ']';

    return time;
  };

  function writeToLog(source, msg) {
    if (!isEnabledForSource(source)) {
      return false;
    }

    var now       = new Date();
    var location  = path.join(logDir, source);
    var file      = path.join( location, now.strftime( '%Y-%m-%d.log' ) );

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

    return true;
  }

  function logMessage(msg) {
    writeToLog(msg.source, msg);
  }

  function logJoined(msg) {
    var time = getTimestamp();
    var out = time + ' ' + msg.user + " has joined " + msg.source;
    writeToLog(msg.source, out);
  }

  function logLeft(msg) {
    var time = getTimestamp();
    var out = time + ' ' + msg.user + " has left " + msg.source;
    writeToLog(msg.source, out);
  }

  function registerPatterns() {
    pluginInterface.registerPattern(
      /.*/,
      logMessage
    );
    pluginInterface.userJoin( function(msg) {
      logJoined(msg);
    });
    pluginInterface.userLeave( function(msg) {
      logLeft(msg);
    });
  }

  function init() {
    if (logEnabled) {
      registerPatterns();
    }
  }

  that = {
    pluginInterface:  pluginInterface,
    init:             init,
    logMessage:       logMessage,
  };
  return that;
};

module.exports = Logger;

