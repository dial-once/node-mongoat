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

Mongoat.MongoClient.connect = function () {
  var _this = this;

  return this.connectMethod.apply(null, arguments)
  .then(function (db) {
    _this.db = db;

    return _this.db;
  })
  .catch(function (err) {
    console.error(err);
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
  var hooks = this.hooks[this.s.namespace] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  if (this.datetime[this.s.namespace]) {
    document.createdAt =  new Date();
  }

  if (this.versioning[this.s.namespace]) {
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

  if (this.versioning[this.s.namespace]) {
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

  if (this.versioning[this.s.namespace]) {
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
  var hooks = this.hooks[this.s.namespace] || {
    before: { insert: [], update: [], remove: [] },
    after: { insert: [], update: [], remove: [] }
  };

  options = options || {};

  promises = utilsHelper.promisify(hooks.before.remove, query);

  if (this.versioning[this.s.namespace]) {
    promises.push(this.commitRemove(query, options));
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

Mongoat.Collection.prototype.datetime = function (isEnabled) {
  if (typeof isEnabled === 'boolean') {
    this.datetime[this.s.namespace] = isEnabled;
  }
};

Mongoat.Collection.prototype.version = function (isEnabled) {
  if (typeof isEnabled === 'boolean') {
    this.versioning[this.s.namespace] = isEnabled;
  }
};

Mongoat.Collection.prototype.commitUpdate = function (query, update, options) {
  var _this  = this;

  return new Promise(function (resolve, reject) {
    _this.findOne(query)
    .then(function (docToUpdate) {
      if (!docToUpdate && options.upsert) {
        update.$setOnInsert = update.$setOnInsert || {};
        update.$setOnInsert._version = 1;

        return resolve(update);
      } else {
        var shadowCol = Mongoat.MongoClient.db.collection(_this.s.name + '.vermongo');
        var id = docToUpdate._id;
        
        docToUpdate._version = docToUpdate._version || 1;
        shadowCol.datetime(true);
        docToUpdate._id = { _id: id, _version: docToUpdate._version };

        shadowCol.insert(docToUpdate)
        .then(function (mongObject) {
          if (mongObject.result.ok === 1 && mongObject.result.n === 1) {
            update.$set = update.$set || {};
            update.$set._version = docToUpdate._id._version + 1;
            return resolve(update);
          }
        });
      }
    });
  });
};

Mongoat.Collection.prototype.commitRemove = function (query, options) {
  var _this  = this;

  return new Promise(function (resolve, reject) {
    _this.findOne(query)
    .then(function (docToRemove) {
      if (docToRemove) {
        var shadowCol = Mongoat.MongoClient.db.collection(_this.s.name + '.vermongo');
        var id = docToRemove._id;
        
        docToRemove._version = docToRemove._version || 1;
        shadowCol.datetime(true);
        docToRemove._id = { _id: id, _version: docToRemove._version };
        docToRemove._version = 'deleted:' + docToRemove._id._version;

        shadowCol.insert(docToRemove)
        .then(function (mongObject) {
          if (mongObject.result.ok === 1 && mongObject.result.n === 1) {
            return resolve(query);
          }
        });
      }
    });
  });
};


// export Mongoat object
module.exports = Mongoat;