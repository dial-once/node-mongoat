'use strict';

var Mongoat = require('mongodb');
var connect = Mongoat.MongoClient.connect;
var hooks = {
  before: {},
  after: {}
};

// Mongoat.MongoClient.connect = function () {
//   var _this = this;
  
//   return connect.apply(null, arguments).then(function(db) {
//     return db;
//   });
// };


Mongoat.Collection.prototype.insertTo = Mongoat.Collection.prototype.insert;

Mongoat.Collection.prototype.before = function(optName, callback) {
  if (hooks.before[optName] === undefined) {
    hooks.before[optName] = [];
  }

  hooks.before[optName].push(callback);
};

Mongoat.Collection.prototype.after = function(optName, callback) {
  if (hooks.after[optName] === undefined) {
    hooks.after[optName] = [];
  }

  hooks.after[optName].push(callback);
};

var promisify = function (array, document) {
  var promises = [];

  array.forEach(function (callback) {
    promises.push(new Promise(function (resolve, reject) {
      resolve(callback(document));
    }));
  });

  return promises;
};

Mongoat.Collection.prototype.insert = function(document, options) {
  var promises = [];

  options = options || {};

  promises = promisify(hooks.before.insert, document);

  console.log(promises);

  var _this = this;

  return Promise.all(promises).then(function (docToInsert) {
    return _this.insertTo(docToInsert[0], options).then(function (mongoObject) {
      promises = [];
      promises = promisify(hooks.after.insert, docToInsert[0]);
      Promise.all(promises);
      return mongoObject;
    });  
  });
};


module.exports = Mongoat;