'use strict';

// modules dependencies
var Mongoat = require('mongodb');
var utilsHelper = require('../helpers/utils-helper');

Mongoat.Collection.prototype.init = function () {
  this.datetime = {};
  this.hooks = {};
  this.versioning = {};
  this.hooksTemplate = {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };
  this.hooks = {};
};

// save methods before overwrite
(function () {
  var opMethod = ['insert', 'update', 'findAndModify', 'remove'];
  var colPrototype = Mongoat.Collection.prototype;

  colPrototype.init();
 
  for (var i = 0; i < opMethod.length; ++i) {
    colPrototype[opMethod[i] + 'Method'] = colPrototype[opMethod[i]];
  }
})();

// add before hook to Collection
Mongoat.Collection.prototype.before = function(opName, callback) {
  this.hooks[this.s.namespace] = this.hooks[this.s.namespace] ?
    this.hooks[this.s.namespace] : this.hooksTemplate;

  this.hooks[this.s.namespace].before[opName].push(callback);
};

// add after hook to Collection
Mongoat.Collection.prototype.after = function(opName, callback) {
  this.hooks[this.s.namespace] = this.hooks[this.s.namespace] ?
    this.hooks[this.s.namespace] : this.hooksTemplate;

  this.hooks[this.s.namespace].after[opName].push(callback);
};

// overwrite insert method to add before and after hooks
Mongoat.Collection.prototype.insert = function(document, options) {
  return this.query('insert', undefined, undefined, document, options);
};

// overwrite update method to add before and after hooks
Mongoat.Collection.prototype.update = function(query, update, options) {
  return this.query('update', query, undefined, update, options);
};

// overwrite findAndModify method to add before and after hooks
Mongoat.Collection.prototype.findAndModify = function(query, sort, update, options) {
  return this.query('findAndModify', query, sort, update, options);
};

// overwrite remove method to add before and after hooks
Mongoat.Collection.prototype.remove = function(query, options) {
  return this.query('remove', query, undefined, undefined, options);
};

// add query to refractor query native method
Mongoat.Collection.prototype.query = function(opName, query, sort, document, options) {
  var promises = [];
  var _this = this;
  var colName = _this.s.namespace;
  var opName_X;

  _this.hooks[colName] = _this.hooks[colName] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};
  opName_X = (opName !== 'findAndModify') ? opName : 'update';

  utilsHelper.setDatetime(opName_X, _this.datetime[colName], document);
  promises = utilsHelper.promisify(_this.hooks[colName].before[opName_X], query, document);

  if (_this.versioning[colName]) {
    promises.push(_this.commit(opName, query, document, options));
  }

  return Promise.all(promises)
  .then(function (docToProcess) {
    var params = utilsHelper.setParams(opName, query, sort, docToProcess[0], options);
    return _this[opName + 'Method'].apply(_this, params)
    .then(function (mongObject) {
      return utilsHelper.processUpdatedDocment(opName, _this, query, mongObject, options)
      .then(function (obj) {
        promises = [];
        promises = utilsHelper.promisify(_this.hooks[colName].after[opName_X], obj);
        Promise.all(promises);

        return mongObject;
      });
    });
  });
};

// add datetime to enable createdAt and updatedAt
Mongoat.Collection.prototype.datetime = function (isEnabled) {
  if (typeof isEnabled === 'boolean') {
    this.datetime[this.s.namespace] = isEnabled;
  }
};

// add version to enable versioning system
Mongoat.Collection.prototype.version = function (isEnabled) {
  if (typeof isEnabled === 'boolean') {
    this.versioning[this.s.namespace] = isEnabled;
  }
};

// add commit to commit document version
Mongoat.Collection.prototype.commit = function (opName, query, document, options) {
  if (opName === 'insert') {
    document._version = 1;
    return document;
  }

  var _this  = this;
  var shadowCol = _this.s.db.collection(_this.s.name + '.vermongo');
  
  shadowCol.datetime(_this.datetime[_this.s.namespace]);

  /*jshint maxcomplexity:10 */
  return _this.findOne(query)
  .then(function (docToProcess) {
    if (docToProcess) {
      var id = docToProcess._id ;
      docToProcess._version = docToProcess._version || 1;
      docToProcess._id = { _id: id, _version: docToProcess._version };
    }
    if (opName === 'update' || opName === 'findAndModify') {
      if (!docToProcess && options.upsert) {
        if (!document.$setOnInsert) {
          document._version = 1;
        } else {
          document.$setOnInsert._version = 1;
        }

        return document;
      }
    } else if (opName === 'remove') {
      if (!docToProcess) {
        throw new Error('Nothing to remove');
      }
      docToProcess._version = 'deleted:' + docToProcess._id._version;
    }
    return shadowCol.insertMethod(docToProcess)
    .then(function () {
      if (opName === 'update' || opName === 'findAndModify') {
        if (!document.$setOnInsert) {
          document._version = docToProcess._id._version + 1;
        } else {
          document.$set._version = docToProcess._id._version + 1;
        }
        return document;
      } else if (opName === 'remove') {
        return query;
      }
    });
  });
};

// add restore to resotre document by version
Mongoat.Collection.prototype.restore = function (version) {
  var col = this.s.db.collection(this.s.name);
  var shadowCol = this.s.db.collection(this.s.name + '.vermongo');
  var aggregatePipeline = [];

  if (version <= 0) {
    aggregatePipeline = [
      { $sort: { '_id._version': -1 } },
      { $skip: Math.abs(version) },
      { $limit: 1 }
    ];
  } else {
    aggregatePipeline = [
      { $match: { '_id._version' : version } },
      { $limit: 1 }
    ];
  }

  return shadowCol.aggregate(aggregatePipeline)
  .nextObject()
  .then(function (document) {
    if (!document) {
      throw new Error('Nothing to restore');
    }

    var id = document._id._id;
    delete document._id;

    return col.update({ _id: id }, document, { upsert: true })
    .then(function (mongObject) {
      if (mongObject.result.ok === 1 && mongObject.result.n === 1) {
        return document;
      }
    });
  });
};

// export Mongoat object
module.exports = Mongoat;