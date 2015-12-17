'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;

describe('Update', function () {
  // connect to db before all tests
  beforeAll(function (done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/mongoatTest')
    .then(function (db) {
      _this.testDb = db;
      return db.dropDatabase();
    })
    .then(function () {
      _this.testCol = _this.testDb.collection('Person.update');
      _this.testCol.datetime(true);
      _this.testCol.version(true);
    })
    .then(done);
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol.find().nextObject()
    .then(function (mongObject) {
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(25);
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject.job).toBe('software engineer');
      expect(mongObject.createdAt).toBeDefined();
    })
    .then(function () {
      _this.testDb.dropDatabase();
    })
    .then(function () {
      _this.testDb.close();
    })
    .then(done);
  });

  // test update without hooks
  it('should upsert new document to collection using callback', function (done) {
    _this.testCol.update(
      { firstName: 'Yacine' },
      { firstName: 'Yacine', lastName: 'KHATAL', age: 25 },
      { upsert: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(0);
      done();
    });
  });

  // test with multiple before and after update hooks
  it('should update document from collection and handle before and after update hooks', function (done) {
    // add before update hooks
    _this.testCol.before('update', function (document) {
      expect(document.$set.job).toBe('software engineer');
      return document;
    });

    _this.testCol.before('update', function (document) {
      expect(document.$set.job).toBe('software engineer');
      document.$set.company = 'Dial Once';
      return document;
    });

    // add after update hooks
    _this.testCol.after('update', function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.value).toBe('object');
      expect(typeof mongObject.lastErrorObject).toBe('object');
      expect(mongObject.value.firstName).toBe('Yacine');
      expect(mongObject.value.lastName).toBe('KHATAL');
      expect(mongObject.value.job).toBe('software engineer');
      expect(mongObject.value.company).toBe('Dial Once');
      expect(mongObject.value.age).toBe(25);
      expect(mongObject.ok).toBe(1);
      expect(mongObject.lastErrorObject.updatedExisting).toBe(true);
      expect(mongObject.lastErrorObject.n).toBe(1);
      return mongObject;
    });

    _this.testCol.after('update', function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.value).toBe('object');
      expect(typeof mongObject.lastErrorObject).toBe('object');
      expect(mongObject.value.firstName).toBe('Yacine');
      expect(mongObject.value.lastName).toBe('KHATAL');
      expect(mongObject.value.job).toBe('software engineer');
      expect(mongObject.value.company).toBe('Dial Once');
      expect(mongObject.value.age).toBe(25);
      expect(mongObject.ok).toBe(1);
      expect(mongObject.lastErrorObject.updatedExisting).toBe(true);
      expect(mongObject.lastErrorObject.n).toBe(1);
      return mongObject;
    });

    _this.testCol.update(
      { firstName: 'Yacine' },
      { $set: { job: 'software engineer' } }
    )
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(1);
    })
    .then(done);
  });
});

describe('Update complex cases: ', function () {
  // connect to db before all tests
  beforeAll(function (done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/mongoatTest')
    .then(function (db) {
      _this.testDb = db;
      return db.dropDatabase();
    })
    .then(function () {
      _this.testCol = _this.testDb.collection('Person.update.complex');
      _this.testCol.datetime(true);
      _this.testCol.version(true);
    })
    .then(done);
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testDb.dropDatabase()
    .then(function () {
      return _this.testDb.close();
    })
    .then(done);
  });

  it('should upsert new document, automatically add an updatedAt, set the createdAt field to tomorrow, and shouldn\'t overwrite the createdAt, _createdAt or test fields shouldn\'t disturb the query', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test0' },
      [['_id', 1]],
      { firstName: 'Test0', test: 'createdAt', _createdAt: today, createdAt: tomorrow },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).toBe(tomorrow.getDate());
      expect(mongObject.value.createdAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value._createdAt.getDate()).toBe(today.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(today.getDate());
      expect(mongObject.value.test).toBe('createdAt');
      done();
    });
  });

  it('should upsert new document, automatically add a createdAt, set the updatedAt field to tomorrow, and shouldn\'t overwrite the updatedAt, _updatedAt or test fields shouldn\'t disturb the query', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test1' },
      [['_id', 1]],
      { firstName: 'Test1', test: 'updatedAt', _updatedAt: today, updatedAt: tomorrow },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.updatedAt.getDate()).toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value._updatedAt.getDate()).toBe(today.getDate());
      expect(mongObject.value.createdAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(today.getDate());
      expect(mongObject.value.test).toBe('updatedAt');
      done();
    });
  });

  it('should upsert new document, automatically add an updatedAt, and set the createdAt field to tomorrow', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test2' },
      [['_id', 1]],
      { $set: { createdAt: tomorrow } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(today.getDate());
      done();
    });
  });

  it('should upsert new document, automatically add an updatedAt, and unset the createdAt field', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test3' },
      [['_id', 1]],
      { $unset: { createdAt: '' } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt).toBeUndefined();
      expect(mongObject.value.updatedAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(today.getDate());
      done();
    });
  });

  it('should upsert new document and set the createdAt and updatedAt fields to tomorrow', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test4' },
      [['_id', 1]],
      { $set: { createdAt: tomorrow }, $setOnInsert: { updatedAt: tomorrow } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(tomorrow.getDate());
      done();
    });
  });

  it('should upsert new document, set the updatedAt to currentDate, and set the createdAt field to tomorrow', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test5' },
      [['_id', 1]],
      { $set: { createdAt: tomorrow }, $currentDate: { updatedAt: true } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(today.getDate());
      done();
    });
  });

  it('should upsert new document, automatically set the createdAt, and set the updatedAt to currentDate', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test6' },
      [['_id', 1]],
      { $set: { lastName: 'test' }, $currentDate: { updatedAt: true } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(today.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(today.getDate());
      done();
    });
  });

  it('should upsert new document and set the updatedAt and createdAt fileds to tomorrow [$setOnInsert], shouldn\'t overwrite them', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test7' },
      [['_id', 1]],
      { $setOnInsert: { updatedAt: tomorrow, createdAt: tomorrow } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(tomorrow.getDate());
      done();
    });
  });

  it('should upsert new document and set the updatedAt and createdAt fileds to tomorrow [$set], shouldn\'t overwrite them', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test8' },
      [['_id', 1]],
      { $set: { updatedAt: tomorrow, createdAt: tomorrow } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(tomorrow.getDate());
      done();
    });
  });

  it('should upsert new document and automatically add the updatedAt and createdAt fileds, test without $set and $setOnInsert', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test9' },
      [['_id', 1]],
      { lastName: 'test' },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(today.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(today.getDate());
      done();
    });
  });

  it('should upsert new document and automatically add the updatedAt and createdAt fileds, test with $set and $setOnInsert', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test9' },
      [['_id', 1]],
      { $setOnInsert: { job: 'test' }, $set: { lastName: 'test' } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(today.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(today.getDate());
      done();
    });
  });

  it('should update document and set the updatedAt and createdAt fileds to tomorrow, shouldn\'t automatically overwrite this fileds', function (done) {
    var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    var today = new Date();
    _this.testCol.findAndModify(
      { firstName: 'Test0' },
      [['_id', 1]],
      { createdAt: tomorrow, updatedAt: tomorrow },
      { new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(mongObject.value.createdAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.createdAt.getDate()).toBe(tomorrow.getDate());
      expect(mongObject.value.updatedAt.getDate()).not.toBe(today.getDate());
      expect(mongObject.value.updatedAt.getDate()).toBe(tomorrow.getDate());
      done();
    });
  });

  // test update without hooks
  it('should upsert new document to collection', function (done) {
    _this.testCol.update(
      { firstName: 'Yacine' },
      { firstName: 'Yacine', lastName: 'KHATAL', age: 25 },
      { upsert: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(0);
      done();
    });
  });

  // test with multiple before and after update hooks
  it('should update document from collection and handle after update hook', function (done) {
    _this.testCol.after('update', function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.value).toBeUndefined();
      expect(mongObject.lastErrorObject).toBeUndefined();
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(1);
      return mongObject;
    });

    _this.testCol.update(
      { firstName: 'Yacine' },
      { $set: { firstName: 'test' } }
    )
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(1);
    })
    .then(done);
  });
});