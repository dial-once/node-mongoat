'use strict';

// modules dependencies
var Mongoat = require('mongodb');
var utilsHelper = require('../helpers/utils-helper');

Mongoat.Collection.prototype.init = function () {
  this.datetime = this.datetime || {};
  this.hooks = this.hooks || {};
};

// save methods before overwrite
(function () {
  var opMethod = ['insert', 'update', 'findAndModify', 'remove'];
  var colPrototype = Mongoat.Collection.prototype;

  for (var i = 0; i < opMethod.length; ++i) {
    colPrototype[opMethod[i] + 'Method'] = colPrototype[opMethod[i]];
  }

  colPrototype.init();
})();

// add before hook to Collection
Mongoat.Collection.prototype.before = function(opName, callback) {
  this.hooks[this.s.namespace] = this.hooks[this.s.namespace] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  this.hooks[this.s.namespace] = utilsHelper.setBeforeOrAfter('before', opName,
    this.hooks[this.s.namespace], callback);
};

// add after hook to Collection
Mongoat.Collection.prototype.after = function(opName, callback) {
  this.hooks[this.s.namespace] = this.hooks[this.s.namespace] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  this.hooks[this.s.namespace] = utilsHelper.setBeforeOrAfter('after', opName,
    this.hooks[this.s.namespace], callback);
};

// overwrite insert method to add before and after hooks
Mongoat.Collection.prototype.insert = function(document, options) {
  var promises = [];
  var _this = this;
  var hooks = this.hooks[this.s.namespace] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  if (this.datetime[this.s.namespace]) {
    document.createdAt =  new Date();
  }

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

// overwrite update method to add before and after hooks
Mongoat.Collection.prototype.update = function(query, update, options) {
  var promises = [];
  var _this = this;
  var hooks = this.hooks[this.s.namespace] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  if (this.datetime[this.s.namespace]) {
    update.$set = update.$set || {};
    update.$setOnInsert = update.$setOnInsert || {};
    update.$set.updatedAt =  new Date();
    update.$setOnInsert.createdAt =  new Date();
  }

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
  var hooks = this.hooks[this.s.namespace] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  if (this.datetime[this.s.namespace]) {
    update.$set = update.$set || {};
    update.$setOnInsert = update.$setOnInsert || {};
    update.$set.updatedAt =  new Date();
    update.$setOnInsert.createdAt =  new Date();
  }

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

// overwrite remove method to add before and after hooks
Mongoat.Collection.prototype.remove = function(query, options) {
  var promises = [];
  var _this = this;
  var hooks = this.hooks[this.s.namespace] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  promises = utilsHelper.promisify(hooks.before.remove, query);

  return Promise.all(promises).then(function (docToRemove) {
    return _this.removeMethod(docToRemove[0], options)
    .then(function (mongoObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.remove, docToRemove[0]);
      Promise.all(promises);
      return mongoObject;
    });
  });
};

Mongoat.Collection.prototype.datetime = function (isEnabled) {
  if (typeof isEnabled === 'boolean') {
    this.datetime[this.s.namespace] = isEnabled;
  }
};

// export Mongoat object
module.exports = Mongoat;