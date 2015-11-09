'use strict';

// modules dependencies
var Mongoat = require('mongodb');
var utilsHelper = require('../helpers/utils-helper');

Mongoat.Collection.prototype.init = function () {
  this.datetime = this.datetime || {};
  this.hooks = this.hooks || {};
  this.versioning = this.versioning || {};
};

// save methods before overwrite
(function () {
  var opMethod = ['insert', 'update', 'findAndModify', 'remove'];
  var colPrototype = Mongoat.Collection.prototype;

  for (var i = 0; i < opMethod.length; ++i) {
    colPrototype[opMethod[i] + 'Method'] = colPrototype[opMethod[i]];
  }

  Mongoat.MongoClient.connectMethod = Mongoat.MongoClient.connect;
  
  colPrototype.init();
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
  var colName = this.s.namespace;
  var hooks = this.hooks[colName] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  utilsHelper.setDatetime('insert', this.datetime[colName], document, options);

  if (this.versioning[colName]) {
    document._version = 1;
  }

  promises = utilsHelper.promisify(hooks.before.insert, document);

  return Promise.all(promises).then(function (docToInsert) {
    return _this.insertMethod(docToInsert[0], options)
    .then(function (mongObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.insert, docToInsert[0]);
      Promise.all(promises);
      return mongObject;
    });
  });
};

// overwrite update method to add before and after hooks
Mongoat.Collection.prototype.update = function(query, update, options) {
  var promises = [];
  var _this = this;
  var colName = this.s.namespace;
  var hooks = this.hooks[colName] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  utilsHelper.setDatetime('update', this.datetime[colName], update, options);

  promises = utilsHelper.promisify(hooks.before.update, update);

  if (this.versioning[colName]) {
    promises.push(this.commitUpdate(query, update, options));
  }

  return Promise.all(promises).then(function (docToUpdate) {
    return _this.updateMethod(query, docToUpdate[0], options)
    .then(function (mongObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.update, docToUpdate[0]);
      Promise.all(promises);
      return mongObject;
    });
  });
};

// overwrite findAndModify method to add before and after hooks
Mongoat.Collection.prototype.findAndModify = function(query, sort, update, options) {
  var promises = [];
  var _this = this;
  var colName = this.s.namespace;
  var hooks = this.hooks[colName] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  utilsHelper.setDatetime('update', this.datetime[colName], update, options);

  promises = utilsHelper.promisify(hooks.before.update, update);

  if (this.versioning[colName]) {
    promises.push(this.commitUpdate(query, update, options));
  }

  return Promise.all(promises).then(function (docToUpdate) {
    return _this.findAndModifyMethod(query, sort, docToUpdate[0], options)
    .then(function (mongObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.update, docToUpdate[0]);
      Promise.all(promises);
      return mongObject;
    });
  });
};

// overwrite remove method to add before and after hooks
Mongoat.Collection.prototype.remove = function(query, options) {
  var promises = [];
  var _this = this;
  var colName = this.s.namespace;
  var hooks = this.hooks[colName] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  promises = utilsHelper.promisify(hooks.before.remove, query);

  if (this.versioning[colName]) {
    promises.push(this.commitRemove(query));
  }

  return Promise.all(promises).then(function (docToRemove) {
    return _this.removeMethod(docToRemove[0], options)
    .then(function (mongObject) {
      promises = [];
      promises = utilsHelper.promisify(hooks.after.remove, docToRemove[0]);
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
      shadowCol.datetime(true);
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
      shadowCol.datetime(true);
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