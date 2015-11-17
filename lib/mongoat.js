'use strict';

// modules dependencies
var utilsHelper = require('../helpers/utils-helper');
var mongodb = require('mongodb');

/**
 * @namespace Mongoat
 */
var Mongoat = mongodb;

Mongoat.Collection.prototype.init = function () {
  this.datetime = {};
  this.hooks = {};
  this.versioning = {};
  this.hooks = {};
};

(function () {
  var opMethod = ['insert', 'update', 'findAndModify', 'remove'];
  var colPrototype = Mongoat.Collection.prototype;

  colPrototype.init();
 
  for (var i = 0; i < opMethod.length; ++i) {
    colPrototype[opMethod[i] + 'Method'] = colPrototype[opMethod[i]];
  }
})();

/**
 * @function before
 * @memberOf Mongoat
 * @description add before hook to Collection
 * @param {String} opName - operation name, can be insert/update/findAndModify or remove
 * @param {Function} callback - the callback to run after the before hook
 * @return {Void} Nothing
 */
Mongoat.Collection.prototype.before = function(opName, callback) {
  this.hooks[this.s.namespace] = this.hooks[this.s.namespace] ||
    utilsHelper.getHooksTemplate();

  this.hooks[this.s.namespace].before[opName].push(callback);
};

/**
 * @function after
 * @memberOf Mongoat
 * @description add after hook to Collection
 * @param {String} opName - operation name, can be insert/update/findAndModify or remove
 * @param {Function} callback - the callback to run after the after hook
 * @return {Void} Nothing
 */
Mongoat.Collection.prototype.after = function(opName, callback) {
  this.hooks[this.s.namespace] = this.hooks[this.s.namespace] ||
    utilsHelper.getHooksTemplate();

  this.hooks[this.s.namespace].after[opName].push(callback);
};

/**
 * @function insert
 * @memberOf Mongoat
 * @description overwrite the insert method
 * @param {Object} document - document to insert
 * @param {Object} options - options used on insert
 * @return {Promise} - returned mongodb object after insert
 */
Mongoat.Collection.prototype.insert = function(document, options, callback) {
  if (callback && typeof callback === 'function') {
    this.query('insert', undefined, undefined, document, options)
    .then(function (result) {
      return callback(null, result);
    })
    .catch(function (err) {
      return callback(err, null);
    });
  } else {
    return this.query('insert', undefined, undefined, document, options);
  }
};

/**
 * @function update
 * @memberOf Mongoat
 * @description overwrite the update method
 * @param {Object} query - query to match
 * @param {Object} update - document to update
 * @param {Object} options - options used on update
 * @return {Promise} - returned mongodb object after update
 */
Mongoat.Collection.prototype.update = function(query, update, options, callback) {
  if (callback && typeof callback === 'function') {
    this.query('update', query, undefined, update, options)
    .then(function (result) {
      return callback(null, result);
    })
    .catch(function (err) {
      return callback(err, null);
    });
  } else {
    return this.query('update', query, undefined, update, options);
  }
};

/**
 * @function findAndModify
 * @memberOf Mongoat
 * @description overwrite the findAndModify method
 * @param {Object} query - query to match
 * @param {Object} sort - sort rules
 * @param {Object} update - document to update
 * @param {Object} options - options used on update
 * @return {Promise} - returned mongodb object after findAndModify
 */
Mongoat.Collection.prototype.findAndModify = function(query, sort, update, options, callback) {
  if (callback && typeof callback === 'function') {
    this.query('findAndModify', query, sort, update, options)
    .then(function (result) {
      return callback(null, result);
    })
    .catch(function (err) {
      return callback(err, null);
    });
  } else {
    return this.query('findAndModify', query, sort, update, options);
  }
};

/**
 * @function remove
 * @memberOf Mongoat
 * @description overwrite the remove method
 * @param {Object} query - query to match
 * @param {Object} options - options used on update
 * @return {Promise} - returned mongodb object after remove
 */
Mongoat.Collection.prototype.remove = function(query, options, callback) {
  if (callback && typeof callback === 'function') {
    this.query('remove', query, undefined, undefined, options)
    .then(function (result) {
      return callback(null, result);
    })
    .catch(function (err) {
      return callback(err, null);
    });
  } else {
    return this.query('remove', query, undefined, undefined, options);
  }
};

/**
 * @function query
 * @memberOf Mongoat
 * @description to make any query, can be insert/update/findAndModify or remove
 * @param {String} opName - operation name, can be insert/update/findAndModify or remove
 * @param {Object} query - query to match
 * @param {Object} sort - sort rules
 * @param {Object} update - document to update
 * @param {Object} options - options used on update
 * @return {Promise} - returned mongodb object after query depending on opName
 */
Mongoat.Collection.prototype.query = function(opName, query, sort, document, options) {
  var promises = [];
  var _this = this;
  var colName = _this.s.namespace;
  var opName_X;

  _this.hooks[colName] = _this.hooks[colName] || utilsHelper.getHooksTemplate();

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

/**
 * @function datetime
 * @memberOf Mongoat
 * @description to enable datetime feature
 * @param {Boolean} isEnabled - to enable or disable feature
 * @return {Void} Nothing
 */
Mongoat.Collection.prototype.datetime = function (isEnabled) {
  if (typeof isEnabled === 'boolean') {
    this.datetime[this.s.namespace] = isEnabled;
  }
};

/**
 * @function version
 * @memberOf Mongoat
 * @description to enable versioning feature
 * @param {Boolean} isEnabled - to enable or disable feature
 * @return {Void} Nothing
 */
Mongoat.Collection.prototype.version = function (isEnabled) {
  if (typeof isEnabled === 'boolean') {
    this.versioning[this.s.namespace] = isEnabled;
  }
};

/**
 * @function commit
 * @memberOf Mongoat
 * @description to commit document version
 * @param {String} opName - operation name, can be insert/update or remove
 * @param {Object} query - query to match
 * @param {Object} document - document to commit
 * @param {Object} options - options used on update
 * @return {Promise} - the document to insert/update or remove
 */
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

/**
 * @function restore
 * @memberOf Mongoat
 * @description to resotre document by version, can +v => version, 0 => last version or -v => last version - v 
 * @param {Number} version - version to restore
 * @return {Promise} - the restored document
 */
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