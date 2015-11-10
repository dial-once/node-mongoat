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

  Mongoat.MongoClient.connectMethod = Mongoat.MongoClient.connect;
})();

// overwrite connect method to get db
Mongoat.MongoClient.connect = function () {
  var _this = this;

  return this.connectMethod.apply(null, arguments)
  .then(function (db) {
    _this.db = db;

    return _this.db;
  });
};

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

// overwrite insert method to add before and after hooks
Mongoat.Collection.prototype.query = function(opName, query, sort, document, options) {
  var promises = [];
  var _this = this;
  var colName = _this.s.namespace;
    
  _this.hooks[colName] = _this.hooks[colName] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };
  
  options = options || {};

  switch(opName) {
  case 'insert':
    utilsHelper.setDatetime('insert', _this.datetime[colName], document);
    promises = utilsHelper.promisify(_this.hooks[colName].before.insert, document);

    if (_this.versioning[colName]) {
      document._version = 1;
    }
    break;
  case 'remove':
    promises = utilsHelper.promisify(_this.hooks[colName].before.remove, query);
    
    if (_this.versioning[colName]) {
      promises.push(_this.commitRemove(query));
    }
    break;
  default:
    utilsHelper.setDatetime('update', _this.datetime[colName], document);
    promises = utilsHelper.promisify(_this.hooks[colName].before.update, document);

    if (_this.versioning[colName]) {
      promises.push(_this.commitUpdate(query, document, options));
    }
    break;
  }

  return Promise.all(promises).then(function (docToProcess) {
    var params = utilsHelper.setParams(opName, query, sort, docToProcess[0], options);
    return _this[opName + 'Method'].apply(_this, params)
    .then(function (mongObject) {
      promises = [];
      if (opName === 'findAndModify') {
        opName = 'update';
      } 
      promises = utilsHelper.promisify(_this.hooks[colName].after[opName], docToProcess[0]);
      Promise.all(promises);
      return mongObject;
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

// add commitUpdate to add version on update
Mongoat.Collection.prototype.commitUpdate = function (query, update, options) {
  var _this  = this;
  return _this.findOne(query)
  .then(function (docToUpdate) {
    if (!docToUpdate && options.upsert) {
      if (!update.$setOnInsert) {
        update._version = 1;
      } else {
        update.$setOnInsert._version = 1;
      }

      return update;
    } else {
      var shadowCol = Mongoat.MongoClient.db.collection(_this.s.name + '.vermongo');
      var id = docToUpdate._id;
      
      docToUpdate._version = docToUpdate._version || 1;
      shadowCol.datetime(_this.datetime[_this.s.namespace]);
      docToUpdate._id = { _id: id, _version: docToUpdate._version };

      return shadowCol.insert(docToUpdate)
      .then(function (mongObject) {
        if (mongObject.result.ok === 1 && mongObject.result.n === 1) {
          if (!update.$setOnInsert) {
            update._version = docToUpdate._id._version + 1;
          } else {
            update.$set._version = docToUpdate._id._version + 1;
          }
          return update;
        }
      });
    }
  });
};

// add commitRemove to add version on remove
Mongoat.Collection.prototype.commitRemove = function (query) {
  var _this  = this;

  return _this.findOne(query)
  .then(function (docToRemove) {
    if (!docToRemove) {
      throw new Error('Nothing to remove');
    }

    if (docToRemove) {
      var shadowCol = Mongoat.MongoClient.db.collection(_this.s.name + '.vermongo');
      var id = docToRemove._id;
      
      docToRemove._version = docToRemove._version || 1;
      shadowCol.datetime(_this.datetime[_this.s.namespace]);
      docToRemove._id = { _id: id, _version: docToRemove._version };
      docToRemove._version = 'deleted:' + docToRemove._id._version;

      return shadowCol.insert(docToRemove)
      .then(function (mongObject) {
        if (mongObject.result.ok === 1 && mongObject.result.n === 1) {
          return query;
        }
      });
    }
  });
};

// add restore to resotre document by version
Mongoat.Collection.prototype.restore = function (version) {
  var db = Mongoat.MongoClient.db;
  var col = db.collection(this.s.name);
  var shadowCol = db.collection(this.s.name + '.vermongo');
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