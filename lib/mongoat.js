'use strict';

// modules dependencies
var utilsHelper = require('../helpers/utils-helper');
var mongodb = require('mongodb');

/**
 * @namespace Mongoat
 */
var Mongoat = mongodb;

/**
 * @private
 * @constructor
 * @description to initialize some properties
 */
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
  return this.query('insert', undefined, undefined, document, options, callback);
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
  return this.query('update', query, undefined, update, options, callback);
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
  return this.query('findAndModify', query, sort, update, options, callback);
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
  return this.query('remove', query, undefined, undefined, options, callback);
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
Mongoat.Collection.prototype.query = function(opName, query, sort, document, options, callback) {
  var promises = [];
  var _this = this;
  var colName = _this.s.namespace;
  var opName_X;
  var mongObject;

  _this.hooks[colName] = _this.hooks[colName] || utilsHelper.getHooksTemplate();

  if (options && typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = options || {};
  opName_X = (opName !== 'findAndModify') ? opName : 'update';

  utilsHelper.setDatetime(opName_X, _this.datetime[colName], document);
  promises = utilsHelper.promisify(_this.hooks[colName].before[opName_X], query, document);

  if (_this.versioning[colName]) {
    promises.push(_this.commit(opName_X, query, document, options));
  }

  return Promise.all(promises)
  .then(function (docToProcess) {
    var params = utilsHelper.setParams(opName, query, sort, docToProcess[0], options);

    return _this[opName + 'Method'].apply(_this, params);
  })
  .then(function (_mongObject) {
    mongObject = _mongObject;
    var isAfterHook = (_this.hooks[colName].after[opName_X].length > 0) ? true : false;

    return utilsHelper.processUpdatedDocment(opName, _this, isAfterHook, query, mongObject, options);
  })
  .then(function (obj) {
    promises = [];
    promises = utilsHelper.promisify(_this.hooks[colName].after[opName_X], obj);
    Promise.all(promises);

    if (callback && typeof callback === 'function') {
      callback(null, mongObject);
    }

    return mongObject;
  })
  .catch(function (err) {
    if (callback && typeof callback === 'function') {
      callback(err, null);
    } else {
      throw err;
    }
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

  return _this.findOne(query)
  .then(function (docToProcess) {
    if (!docToProcess) {
      if (document && document._version) return document;
      if (options.upsert && opName === 'update' && !utilsHelper.hasPropertyWithStartingChar(document, '$')) {
        document._version = 1;
      } else if (options.upsert && opName === 'update') {
        document.$setOnInsert = document.$setOnInsert || {};
        document.$setOnInsert._version = 1;
      }

      return ((opName === 'remove') ? query : document);
    }

    return _this.insertToShadowCollection(opName, query, document, docToProcess);
  });
};

/**
 * @function insertToShadowCollection
 * @private
 * @description to commit insert docToprocess to collection.vermongo and set document version
 * @param {String} opName - operation name, can be insert/update or remove
 * @param {Object} query - query to match
 * @param {Object} document - document to set it's version
 * @param {Object} docToProcess - document to insert to shadow collection
 * @return {Promise} - the document if insert/update or query if remove
 */
Mongoat.Collection.prototype.insertToShadowCollection = function(opName, query, document, docToProcess) {
  var shadowCol = this.s.db.collection(this.s.name + '.vermongo');
  shadowCol.datetime(this.datetime[this.s.namespace]);

  var id = docToProcess._id;
  docToProcess._id = { _id: id, _version: docToProcess._version || 1 };
  docToProcess._version = (opName === 'remove') ? 'deleted:' + docToProcess._version : (docToProcess._version || 1);

  return shadowCol.insertMethod(docToProcess)
  .then(function () {
    if (opName === 'update' && !utilsHelper.hasPropertyWithStartingChar(document, '$')) {
      document._version = docToProcess._id._version + 1;
    } else if (opName === 'update') {
      document.$set = document.$set || {};
      document.$setOnInsert = document.$setOnInsert || {};
      document.$set._version = docToProcess._id._version + 1;
      document.$setOnInsert._version = docToProcess._id._version + 1;
    }

    return ((opName === 'remove') ? query : document);
  });
};

/**
 * @function getVersion
 * @memberOf Mongoat
 * @description to get document by version, can +v => version, 0 => last version or -v => last version - v
 * @param {Object} id - id of the document to restore
 * @param {Number} version - version of the document to restore
 * @return {Promise} - the requested document
 */
Mongoat.Collection.prototype.getVersion = function(id, version) {
  var shadowCol = this.s.db.collection(this.s.name + '.vermongo');
  version = version || 0;

  if (!id) {
    throw new Error('The provided id is null or undefined');
  }

  if (version <= 0) {
    return shadowCol.find({ '_id._id': id })
    .sort({ '_id._version': -1 })
    .skip(Math.abs(version))
    .limit(1)
    .nextObject();
  } else {
    return shadowCol.find({ '_id._id': id, '_id._version': version })
    .nextObject();
  }
};

/**
 * @function restore
 * @memberOf Mongoat
 * @description to resotre document by version, can +v => version, 0 => last version or -v => last version - v
 * @param {Object} id - id of the document to restore
 * @param {Number} version - version of the document to restore
 * @return {Promise} - the restored document
 */
Mongoat.Collection.prototype.restore = function (id, version) {
  var col = this.s.db.collection(this.s.name);
  var _this = this;
  var lastVersion;
  var document;
  var _id;

  version = version || 0;

  if (!id) {
    throw new Error('The provided id is null or undefined');
  }

  return _this.getVersion(id, 0)
  .then(function (lastVersionDoc) {
    lastVersion = lastVersionDoc._id._version;
  })
  .then(function () {
    return _this.getVersion(id, version);
  })
  .then(function (_document) {
    document = _document;

    if (!document) {
      throw new Error('The requested version doesn\'t exist');
    }

    _id = document._id._id;
    delete document._id;
    document._version = lastVersion + 1;
  })
  .then(function () {
    return col.update({ _id: _id }, document, { upsert: true });
  })
  .then(function () {
    return document;
  });
};

// export Mongoat object
module.exports = Mongoat;
