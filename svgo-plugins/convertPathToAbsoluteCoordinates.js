'use strict';

exports.type = 'perItem';

exports.active = true;

exports.description = 'Converts paths to absolute coordinates, regardless of its effect on file size';

exports.params = {};

var pathElems = require('svgo/plugins/_collections.js').pathElems,
    path2js = require('svgo/plugins/_path.js').path2js,
    js2path = require('svgo/plugins/_path.js').js2path,
    relative2absolute = require('svgo/plugins/_path.js').relative2absolute;

/**
 * Converts relative path coordinates to absolute
 */
exports.fn = function(item, params) {
  if (item.isElem(pathElems) && item.hasAttr('d')) {

    var data = path2js(item);

    if (data.length) {
      data = relative2absolute(data);
      js2path(item, data, params);
    }
  }
};
