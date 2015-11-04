'use strict';

var Mongoat = require('mongodb');
var utilsHelper = require('../helpers/utils-helper');
var connect = Mongoat.MongoClient.connect;
var hooks = {
  before: {},
  after: {}
};

(function(){
  var opArray = ['insert', 'update', 'remove'];
  var colPrototype = Mongoat.Collection.prototype;

  for (var i = 0; i < opArray.length; ++i) {
    colPrototype[opArray[i] + 'Method'] = colPrototype[opArray[i]];
  }
})();

Mongoat.Collection.prototype.before = function(opName, callback) {
  hooks = utilsHelper.beforeAfter('before', opName, hooks, callback);
};

Mongoat.Collection.prototype.after = function(opName, callback) {
  hooks = utilsHelper.beforeAfter('after', opName, hooks, callback);
};

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

module.exports = Mongoat;