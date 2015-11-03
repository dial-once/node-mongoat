'use strict';

var Utils = {
  promisify: function (array, document) {
    var promises = [];

    array.forEach(function (promisedCallback) {
      promises.push(promisedCallback(document));
    });

    return promises;
  }
};

// export Utils helper
module.exports = Utils;