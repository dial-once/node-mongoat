'use strict';

// modules dependencies
var Mongoat = require('mongodb');
var utilsHelper = require('../helpers/utils-helper');

var hooks = {
  before: {},
  after: {}
};

// save methods before overwrite
(function(){
  var opMethod = ['insert', 'update', 'findAndModify', 'remove'];
  var colPrototype = Mongoat.Collection.prototype;

  for (var i = 0; i < opMethod.length; ++i) {
    colPrototype[opMethod[i] + 'Method'] = colPrototype[opMethod[i]];
  }
})();

// add before hook to Collection
Mongoat.Collection.prototype.before = function(opName, callback) {
  hooks = utilsHelper.beforeAfter('before', opName, hooks, callback);
};

// add after hook to Collection
Mongoat.Collection.prototype.after = function(opName, callback) {
  hooks = utilsHelper.beforeAfter('after', opName, hooks, callback);
};

// overwrite insert method to add before and after hooks
Mongoat.Collection.prototype.insert = function(document, options) {
  var promises = [];
  var _this = this;
  options = options || {};

  promises = utilsHelper.promisify(hooks.before.insert, document);

  return Promise.all(promises).then(function (docToUpdate) {
    return _this.insertMethod(docToUpdate[0], options)
    .then(function (mongoObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.insert, docToUpdate[0]);
      Promise.all(promises);
      return mongoObject;
    });  
  });
};

// overwrite update method to add before and after hooks
Mongoat.Collection.prototype.update = function(query, update, options) {
  var promises = [];
  var _this = this;
  options = options || {};

  promises = utilsHelper.promisify(hooks.before.update, update);

  return Promise.all(promises).then(function (docToUpdate) {
    return _this.updateMethod(query, docToUpdate[0], options)
    .then(function (mongoObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.update, docToUpdate[0]);
      Promise.all(promises);
      return mongoObject;
    });  
  });
};

// overwrite findAndModify method to add before and after hooks
Mongoat.Collection.prototype.findAndModify = function(query, sort, update, options) {
  var promises = [];
  var _this = this;
  options = options || {};

  promises = utilsHelper.promisify(hooks.before.update, update);

  return Promise.all(promises).then(function (docToUpdate) {
    return _this.findAndModifyMethod(query, sort, docToUpdate[0], options)
    .then(function (mongoObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.update, docToUpdate[0]);
      Promise.all(promises);
      return mongoObject;
    });  
  });
};

// export Mongoat object
module.exports = Mongoat;