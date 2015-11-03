'use strict';

var Utils = {
  promisify: function (array, document) {
    var promises = [];

    array.forEach(function (promisedCallback) {
      promises.push(promisedCallback(document));
    });

    return promises;
  },

  beforeAfter: function (opType, opName, hooks, callback) {
    var promisedCallback = function (query) {
      return new Promise(function(resolve, reject) {
        return resolve(callback(query));
      });
    };

    if (opType === 'before') {
      if (hooks.before[opName] === undefined) {
        hooks.before[opName] = [];
      }
      
      hooks.before[opName].push(promisedCallback);
    } else if (opType === 'after') {
      if (hooks.after[opName] === undefined) {
        hooks.after[opName] = [];
      }

      hooks.after[opName].push(promisedCallback);
    }

    return hooks;
  }
};

// export Utils helper
module.exports = Utils;