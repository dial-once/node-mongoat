'use strict';

var Utils = {
  promisify: function (array, document) {
    var promises = [];

    array.forEach(function (promisedCallback) {
      promises.push(promisedCallback(document));
    });

    return promises;
  },

  setBeforeOrAfter: function (opType, opName, hooks, callback) {
    var promisedCallback = function (query) {
      return new Promise(function(resolve, reject) {
        reject = reject || null; // to avoid jshint unused code
        return resolve(callback(query));
      });
    };

    if (opType === 'before') {
      hooks.before[opName].push(promisedCallback);
    } else if (opType === 'after') {
      hooks.after[opName].push(promisedCallback);
    }

    return hooks;
  }
};

// export Utils helper
module.exports = Utils;