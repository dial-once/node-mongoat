'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;

// test update method
describe('Update', function () {
  // connect to db before all tests
  beforeAll(function (done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/mongoatTest')
    .then(function (db) {
      db.dropDatabase();
      _this.testDb = db;
      _this.testCol = db.collection('Person.update');
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

      _this.testDb.dropDatabase();
      _this.testDb.close();
      
      done();
    });
  });

  // test update without hooks
  it('should upsert new document to collection',
  function (done) {
    _this.testCol.update(
      { firstName: 'Yacine' },
      { firstName: 'Yacine', lastName: 'KHATAL', age: 25 },
      { upsert: true }
    ).then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(0);
      
      done();
    });
  });

  // test with multiple before and after update hooks
  it('should update document from collection and handle before and after update hooks',
  function (done) {
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
    ).then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(1);
      
      done();
    });
  });
});
