'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'Convert paths to unit coordinate space';

exports.params = {};

var pathElems = require('svgo/plugins/_collections.js').pathElems,
    path2js = require('svgo/plugins/_path.js').path2js,
    js2path = require('svgo/plugins/_path.js').js2path;

exports.fn = function(item, params) {
  if (item.isElem(pathElems) && item.hasAttr('d')) {

    var data = path2js(item);

    if (data.length) {

      var bounds = extent(data);

      data.forEach(function(command) {
        var scaled = [];

        if (command.instruction == 'V') {
          scaled = [ command.data[0] / bounds.y ];

          // Multiple y values can be provided (although
          // usually, this doesn't make sense).
        } else if (command.instruction == 'H') {
          scaled = [ command.data[0] / bounds.x ];

          // Multiple x values can be provided (although
          // usually, this doesn't make sense).
        } else if (command.data !== undefined) {
          if (command.data.length % 2 != 0) {
            throw 'Path command has uneven xy pair count';
          }

          for(var pt = 0; pt < command.data.length; pt += 2) {
            scaled.push(command.data[pt] / bounds.x);
            scaled.push(command.data[pt + 1] / bounds.y);
          }
        }

        command.data = scaled;
      });

      js2path(item, data, params);
    }
  }
};

function extent(data) {
  var bounds = {
    min: {
      x: Number.POSITIVE_INFINITY,
      y: Number.POSITIVE_INFINITY
    },
    max: {
      x: Number.NEGATIVE_INFINITY,
      y: Number.NEGATIVE_INFINITY
    }
  };

  function accumulate(pair) {
    if (pair.x !== undefined) {
      if (pair.x < bounds.min.x)
        bounds.min.x = pair.x;
      if (pair.x > bounds.max.x)
        bounds.max.x = pair.x;
    }

    if (pair.y !== undefined) {
      if (pair.y < bounds.min.y)
        bounds.min.y = pair.y;
      if (pair.y > bounds.max.y)
        bounds.max.y = pair.y;
    }
  }

  data.forEach(function(command) {
    if (command.instruction == 'V') {
      accumulate({y: command.data[0]});

      // Multiple y values can be provided (although
      // usually, this doesn't make sense).
    } else if (command.instruction == 'H') {
      accumulate({x: command.data[0]});

      // Multiple x values can be provided (although
      // usually, this doesn't make sense).
    } else if (command.data !== undefined) {
      if (command.data.length % 2 != 0) {
        throw 'Path command has uneven xy pair count';
      }
      for(var pt = 0; pt < command.data.length; pt += 2) {
        accumulate({x: command.data[pt], y: command.data[pt + 1]});
      }
    }
  });

  return {
    x: bounds.max.x - bounds.min.x,
    y: bounds.max.y - bounds.min.y
  };
}