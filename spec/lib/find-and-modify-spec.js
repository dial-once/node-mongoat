'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;

// test findAndModify method
describe('FindAndModify', function () {
  // connect to db before all tests
  beforeAll(function (done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/mongoatTest')
    .then(function (db) {
      _this.testDb = db;
      return db.dropDatabase();
    })
    .then(function () {
      _this.testCol = _this.testDb.collection('Person.findAndModify');
      _this.testCol.datetime(true);
    })
    .then(done);
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol.find()
    .nextObject()
    .then(function (mongObject) {
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(26);
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject.job).toBe('software engineer');
      expect(mongObject.createdAt).toBeDefined();
      expect(mongObject.updatedAt).toBeDefined();
    })
    .then(function () {
      _this.testDb.dropDatabase();
    })
    .then(function () {
      _this.testDb.close();
    })
    .then(done);
  });

  // test findAndModify without hooks
  it('should upsert new document to Person collection [test with versionning disabled]', function (done) {
    _this.testCol.findAndModify(
      { firstName: 'Yacine' },
      [['_id', 1]],
      { $setOnInsert: { lastName: 'KHATAL', age: 25 } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.value).toBe('object');
      expect(typeof mongObject.lastErrorObject).toBe('object');
      expect(mongObject.value.firstName).toBe('Yacine');
      expect(mongObject.value.lastName).toBe('KHATAL');
      expect(mongObject.value.age).toBe(25);
      expect(mongObject.ok).toBe(1);
      expect(mongObject.lastErrorObject.updatedExisting).toBe(false);
      expect(mongObject.lastErrorObject.n).toBe(1);
      expect(mongObject.value._version).toBeUndefined();
      done();
    });
  });

  // test findAndModify without hooks
  it('should update new document to Person collection [test with versionning enabled]', function (done) {
    _this.testCol.version(true);
    _this.testCol.findAndModify(
      { firstName: 'Yacine' },
      [['_id', 1]],
      { $set: { age: 26 } },
      { upsert: true, new: true },
    function (err, mongObject) {
      expect(err).toBe(null);
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.value).toBe('object');
      expect(typeof mongObject.lastErrorObject).toBe('object');
      expect(mongObject.value.firstName).toBe('Yacine');
      expect(mongObject.value.lastName).toBe('KHATAL');
      expect(mongObject.value.age).toBe(26);
      expect(mongObject.ok).toBe(1);
      expect(mongObject.lastErrorObject.updatedExisting).toBe(true);
      expect(mongObject.lastErrorObject.n).toBe(1);
      expect(mongObject.value._version).toBe(2);
      done();
    });
  });

  // test with multiple before and after findAndModify hooks
  it('should findAndModify document from Person collection and handle before and after update hooks', function (done) {
    // add before findAndModify hooks
    _this.testCol.before('update', function (document) {
      expect(document.$set.job).toBe('software engineer');
      return document;
    });

    _this.testCol.before('update', function (document) {
      expect(document.$set.job).toBe('software engineer');
      document.$set.company = 'Dial Once';
      return document;
    });

    // add after findAndModify hooks
    _this.testCol.after('update', function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.value).toBe('object');
      expect(typeof mongObject.lastErrorObject).toBe('object');
      expect(mongObject.value.firstName).toBe('Yacine');
      expect(mongObject.value.lastName).toBe('KHATAL');
      expect(mongObject.value.job).toBe('software engineer');
      expect(mongObject.value.company).toBe('Dial Once');
      expect(mongObject.value.age).toBe(26);
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
      expect(mongObject.value.age).toBe(26);
      expect(mongObject.ok).toBe(1);
      expect(mongObject.lastErrorObject.updatedExisting).toBe(true);
      expect(mongObject.lastErrorObject.n).toBe(1);
      return mongObject;
    });

    _this.testCol.findAndModify(
      { firstName: 'Yacine' },
      [['_id', 1]],
      { $set: { job: 'software engineer' } },
      { upsert: true, new: true }
    )
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.value).toBe('object');
      expect(typeof mongObject.lastErrorObject).toBe('object');
      expect(mongObject.value.firstName).toBe('Yacine');
      expect(mongObject.value.lastName).toBe('KHATAL');
      expect(mongObject.value.job).toBe('software engineer');
      expect(mongObject.value.company).toBe('Dial Once');
      expect(mongObject.value.age).toBe(26);
      expect(mongObject.ok).toBe(1);
      expect(mongObject.lastErrorObject.updatedExisting).toBe(true);
      expect(mongObject.lastErrorObject.n).toBe(1);
    })
    .then(done);
  });
});
