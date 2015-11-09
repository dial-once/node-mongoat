'use strict';

var Utils = {
  promisify: function (array, document) {
    var promises = [];

    array.forEach(function (promisedCallback) {
      promises.push(promisedCallback(document));
    });
    
    if (array.length <= 0) {
      promises.push(new Promise(function(resolve, reject) {
        reject = reject || null; // to avoid jshint unused code
        return resolve(document);
      }));
    }

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
  },

  setDatetime: function (opName, datetime, document, options) {
    if (datetime) {
      if (opName === 'update') {
        if (!document.$set && !document.$setOnInsert) {
          document.updatedAt = new Date();
          document.createdAt = new Date();
        } else {
          document.$set = document.$set || {};
          document.$set.updatedAt = new Date();
          
          document.$setOnInsert = document.$setOnInsert || {};
          document.$setOnInsert.createdAt = new Date();
        }
      } else if (opName === 'insert') {
        document.createdAt = new Date();
        document.updatedAt = new Date();
      }
    }
    return document;
  }
};

// export Utils helper
module.exports = Utils;