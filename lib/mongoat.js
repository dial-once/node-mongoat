'use strict';

var Mongoat = require('mongodb');
var utilsHelper = require('../helpers/utils-helper');
var connect = Mongoat.MongoClient.connect;
var hooks = {
  before: {},
  after: {}
};

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

Mongoat.Collection.prototype.insertTo = Mongoat.Collection.prototype.insert;

Mongoat.Collection.prototype.insert = function(document, options) {
  var promises = [];
  var _this = this;
  options = options || {};

  promises = utilsHelper.promisify(hooks.before.insert, document);

  return Promise.all(promises).then(function (docToInsert) {
    return _this.insertTo(docToInsert[0], options).then(function (mongoObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.insert, docToInsert[0]);
      Promise.all(promises);
      return mongoObject;
    });  
  });
};


module.exports = Mongoat;