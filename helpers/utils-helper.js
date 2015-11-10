'use strict';

var Utils = {
  promisify: function (array, query, document) {
    var promises = [];

    if (query && !document) {
      document = query;
    }

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

  setDatetime: function (opName, datetime, document) {
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
  },

  setParams: function (opName, query, sort, docToProcess, options) {
    var params = [];

    switch(opName) {
    case 'update':
      params.push(query, docToProcess, options);
      break;
    case 'findAndModify':
      params.push(query, sort, docToProcess, options);
      break;
    default:
      params.push(docToProcess, options);
      break;
    }

    return params;
  }
};

// export Utils helper
module.exports = Utils;