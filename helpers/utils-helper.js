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
  },

  processUpdatedDocment: function (opName, collection, query, mongObject, options) {
    if (opName === 'update' && mongObject.result.ok) {
      var objToReturn = {
        value: [],
        lastErrorObject: {}
      };

      return collection.find(query)
      .toArray()
      .then(function (updatedDocs) {
        objToReturn.value = (options && options.multi && mongObject.result.n > 1) ?
          updatedDocs : updatedDocs[0];

        objToReturn.lastErrorObject.updatedExisting = (mongObject.result.nModified) ? true: false;

        objToReturn.lastErrorObject.n = mongObject.result.n;

        if (!mongObject.result.nModified && mongObject.result.upserted) {
          objToReturn.lastErrorObject.upserted = updatedDocs[0]._id;
        }

        objToReturn.ok = mongObject.result.ok;

        return objToReturn;
      });
    } else {
      /*jshint unused: false*/
      return new Promise(function (resolve, reject) {
        resolve(mongObject);
      });
    }
  },

  getHooksTemplate: function () {
    return {
      before: { insert: [], update: [], remove: [] },
      after: { insert: [], update: [], remove: [] }
    };
  }
};

// export Utils helper
module.exports = Utils;