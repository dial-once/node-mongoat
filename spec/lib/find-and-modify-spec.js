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
      db.dropDatabase();
      _this.testDb = db;
      _this.testCol = db.collection('Person.findAndModify');
      _this.testCol.datetime(true);
      _this.testCol.version(true);

      done();
    });
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol.find()
    .nextObject()
    .then(function (mongObject) {
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(25);
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject.job).toBe('software engineer');
      expect(mongObject.createdAt).toBeDefined();
      expect(mongObject.updatedAt).toBeDefined();

      _this.testDb.dropDatabase();
      _this.testDb.close();
      done();
    });
  });

  // test findAndModify without hooks
  it('should upsert new document to Person collection',
  function (done) {
    _this.testCol.findAndModify(
      { firstName: 'Yacine' },
      [['_id', 1]],
      { $setOnInsert: { lastName: 'KHATAL', age: 25 } },
      { upsert: true, new: true }
    ).then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.value).toBe('object');
      expect(typeof mongObject.lastErrorObject).toBe('object');
      expect(mongObject.value.firstName).toBe('Yacine');
      expect(mongObject.value.lastName).toBe('KHATAL');
      expect(mongObject.value.age).toBe(25);
      expect(mongObject.ok).toBe(1);
      expect(mongObject.lastErrorObject.updatedExisting).toBe(false);
      expect(mongObject.lastErrorObject.n).toBe(1);
      
      done();
    });
  });

  // test with multiple before and after findAndModify hooks
  it('should findAndModify document from Person collection and handle before and after update hooks',
  function (done) {
    // add before findAndModify hooks
    _this.testCol.before('update', function (object) {
      expect(object.$set.job).toBe('software engineer');
      return object;
    });

    _this.testCol.before('update', function (object) {
      expect(object.$set.job).toBe('software engineer');
      object.$set.company = 'Dial Once';
      return object;
    });

    // add after findAndModify hooks
    _this.testCol.after('update', function (object) {
      expect(object.$set.job).toBe('software engineer');
      expect(object.$set.company).toBe('Dial Once');
      return object;
    });

    _this.testCol.after('update', function (object) {
      expect(object.$set.job).toBe('software engineer');
      expect(object.$set.company).toBe('Dial Once');
      return object;
    });

    _this.testCol.findAndModify(
      { firstName: 'Yacine' },
      [['_id', 1]],
      { $set: { job: 'software engineer' } },
      { upsert: true, new: true }
    ).then(function (mongObject) {
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

      done();
    });
  });
});
