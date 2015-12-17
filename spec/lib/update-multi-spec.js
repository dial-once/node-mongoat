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
      _this.testDb = db;
      return db.dropDatabase();
    })
    .then(function () {
      _this.testCol = _this.testDb.collection('Person.multi.update');
      _this.testCol.datetime(true);
      _this.testCol.version(true);
    })
    .then(done);
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol.find().toArray()
    .then(function (mongObject) {
      expect(mongObject.length).toBe(2);
      expect(mongObject[0].firstName).toBe('Yacine');
      expect(mongObject[0].lastName).toBe('KHATAL');
      expect(mongObject[0].relation).toBe('brothers');
      expect(mongObject[0].from).toBe('Algeria');
      expect(mongObject[0].age).toBe(25);
      expect(mongObject[1].firstName).toBe('Hichem');
      expect(mongObject[1].lastName).toBe('KHATAL');
      expect(mongObject[1].relation).toBe('brothers');
      expect(mongObject[1].from).toBe('Algeria');
      expect(mongObject[1].age).toBe(28);
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
  it('should upsert new document to collection', function (done) {
    _this.testCol.update(
      { firstName: 'Yacine' },
      { firstName: 'Yacine', lastName: 'KHATAL', age: 25 },
      { upsert: true }
    )
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(0);
    })
    .then(done);
  });

  // test update without hooks
  it('should upsert new document to collection', function (done) {
    _this.testCol.update(
      { firstName: 'Hichem' },
      { firstName: 'Hichem', lastName: 'KHATAL', age: 28 },
      { upsert: true }
    )
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(0);
    })
    .then(done);
  });

  // test with multiple before and after update hooks
  it('should update multiple documents from collection and handle before and after update hooks', function (done) {
    // add before update hooks
    _this.testCol.before('update', function (document) {
      expect(document.$set.relation).toBe('brothers');
      return document;
    });

    _this.testCol.before('update', function (document) {
      expect(document.$set.relation).toBe('brothers');
      document.$set.from = 'Algeria';
      return document;
    });

    // add after update hooks
    _this.testCol.after('update', function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.value).toBe('object');
      expect(typeof mongObject.lastErrorObject).toBe('object');
      expect(mongObject.value[0].firstName).toBe('Yacine');
      expect(mongObject.value[0].lastName).toBe('KHATAL');
      expect(mongObject.value[0].relation).toBe('brothers');
      expect(mongObject.value[0].from).toBe('Algeria');
      expect(mongObject.value[0].age).toBe(25);
      expect(mongObject.value[1].firstName).toBe('Hichem');
      expect(mongObject.value[1].lastName).toBe('KHATAL');
      expect(mongObject.value[1].relation).toBe('brothers');
      expect(mongObject.value[1].from).toBe('Algeria');
      expect(mongObject.value[1].age).toBe(28);
      expect(mongObject.ok).toBe(1);
      expect(mongObject.lastErrorObject.updatedExisting).toBe(true);
      expect(mongObject.lastErrorObject.n).toBe(2);
      return mongObject;
    });

    _this.testCol.after('update', function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.value).toBe('object');
      expect(typeof mongObject.lastErrorObject).toBe('object');
      expect(mongObject.value[0].firstName).toBe('Yacine');
      expect(mongObject.value[0].lastName).toBe('KHATAL');
      expect(mongObject.value[0].relation).toBe('brothers');
      expect(mongObject.value[0].from).toBe('Algeria');
      expect(mongObject.value[0].age).toBe(25);
      expect(mongObject.value[1].firstName).toBe('Hichem');
      expect(mongObject.value[1].lastName).toBe('KHATAL');
      expect(mongObject.value[1].relation).toBe('brothers');
      expect(mongObject.value[1].from).toBe('Algeria');
      expect(mongObject.value[1].age).toBe(28);
      expect(mongObject.ok).toBe(1);
      expect(mongObject.lastErrorObject.updatedExisting).toBe(true);
      expect(mongObject.lastErrorObject.n).toBe(2);
      return mongObject;
    });

    _this.testCol.update(
      { lastName: 'KHATAL' },
      { $set: { relation: 'brothers' } },
      { multi: true }
    )
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(2);
      expect(mongObject.result.nModified).toBe(2);
    })
    .then(done);
  });
});
