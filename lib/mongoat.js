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
  var opMethod = ['insert', 'update', 'remove'];
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

  return Promise.all(promises).then(function (docToInsert) {
    return _this.insertMethod(docToInsert[0], options)
    .then(function (mongoObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.insert, docToInsert[0]);
      Promise.all(promises);
      return mongoObject;
    });  
  });
};

// export Mongoat object
module.exports = Mongoat;