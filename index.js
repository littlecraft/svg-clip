'use strict';

var SVGO = require('svgo');
var FS = require('fs');
var PATH = require('path');

module.exports = run;

function run() {
  var args = process.argv;
  args.splice(0, 2);

  if (args.length < 2) {
    throw 'Usage: svg-clip <input> <output>';
  }

  var input = args[0];
  var output = args[1];

  var config = {};

  FS.readFile(input, 'utf8', function(err, data) {
    if (err) {
        if (err.code === 'EISDIR')
            console.error('Error: input must be a file');
        else if (err.code === 'ENOENT')
            console.error('Error: no such file \'' + input + '\'.');
        else
            console.error(err);
        return;
    }

    processFromString(data, config, input, output);
  });
}

function processFromString(svg, config, input, output) {
  var svgo = svgoWithCustomPlugins(config);

  svgo.optimize(svg, function(result) {
    if (result.error) {
        console.error(result.error);
        return;
    }

    FS.writeFile(output, result.data, 'utf8');
  });
}

function svgoWithCustomPlugins(config) {
  var plugins = loadPlugins();

  plugins.forEach(function(plugin) {
    config = applyPluginOverrides(plugin, config);
  });

  var svgo = new SVGO(config);

  svgo.config = applyPlugins(plugins, svgo.config);

  return svgo;
}

function loadPlugins() {
  var plugins = [];

  var names = [
    'convertPathToAbsoluteCoordinates',
    'convertPathToUnitCoordinates'
  ];

  names.forEach(function(name) {
    var plugin = require('./svgo-plugins/' + name);
    plugin.name = name;

    plugins.push(plugin);
  });

  return plugins;
}

function applyPluginOverrides(plugin, config) {
  if (plugin.overrides) {

    if (config.plugins) {
      plugin.overrides.forEach(function(name) {
        var matched, key;

        config.plugins.forEach(function(other) {
          if (typeof other === 'object') {
            key = Object.keys(other)[0];
          } else {
            key = other;
          }

          if (key === name) {
            if (typeof other[key] !== 'object') {
              other[key] = false;
            }

            matched = true;
          }
        });

        if (!matched) {
          var obj = {};

          obj[name] = false;

          config.plugins.push(obj);
          matched = true;
        }
      });
    } else {
      config.plugins = [];

      plugin.overrides.forEach(function(name) {
        var obj = {};
        obj[name] = false;
        config.plugins.push(obj);
      });
    }
  }

  return config;
}

function applyPlugins(plugins, config) {
  plugins.forEach(function(plugin) {
    config.plugins.push([plugin]);
  });

  return config;
}

run();