'use strict';

var Mongoat = require('mongodb');
var connect = Mongoat.MongoClient.connect;
var hooks = {
  before: {},
  after: {}
};

Mongoat.Collection.prototype.insertTo = Mongoat.Collection.prototype.insert;

Mongoat.Collection.prototype.before = function(optName, callback) {
  if (hooks.before[optName] === undefined) {
    hooks.before[optName] = [];
  }

  var promisedCallback = function (query) {
    return new Promise(function(resolve, reject) {
      return resolve(callback(query));
    });
  };

  hooks.before[optName].push(promisedCallback);
};

Mongoat.Collection.prototype.after = function(optName, callback) {
  if (hooks.after[optName] === undefined) {
    hooks.after[optName] = [];
  }

  var promisedCallback = function (query) {
    return new Promise(function(resolve, reject) {
      return resolve(callback(query));
    });
  };

  hooks.after[optName].push(promisedCallback);
};

var promisify = function (array, document) {
  var promises = [];

  array.forEach(function (promisedCallback) {
    promises.push(promisedCallback(document));
  });

  return promises;
};

Mongoat.Collection.prototype.insert = function(document, options) {
  var promises = [];
  var _this = this;
  options = options || {};

  promises = promisify(hooks.before.insert, document);

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