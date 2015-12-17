'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;

// test insert method
describe('Remove', function () {
  // connect to db before all tests
  beforeAll(function (done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/mongoatTest')
    .then(function (db) {
      _this.testDb = db;
      return db.dropDatabase();
    })
    .then(function () {
      _this.testCol = _this.testDb.collection('Person.remove');
      _this.testCol.datetime(true);
      _this.testCol.version(true);
    })
    .then(done);
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol.find().toArray()
    .then(function (mongoArray) {
      expect(mongoArray.length).toBe(0);
    })
    .then(function () {
      _this.testDb.dropDatabase();
    })
    .then(function () {
      _this.testDb.close();
    })
    .then(done);
  });

  // test remove with promise
  it('should remove nothing and return mongObject using promise', function (done) {
    _this.testCol.remove({ test: '' })
    .then(function (mongObject) {
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(0);
    })
    .then(done);
  });

  // test remove with callback
  it('should remove nothing and return mongObject using callback', function (done) {
    _this.testCol.remove({ test: '' }, function (err, mongObject) {
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(0);
      expect(err).toBe(null);
      done();
    });
  });

  // test insert without hooks
  it('should insert new document to Person collection', function (done) {
    _this.testCol.insert({
      firstName: 'Yacine',
      lastName: 'KHATAL',
      age: 25
    })
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
    })
    .then(done);
  });

  // test with multiple before and after insert hooks
  it('should remove document from Person collection and handle before and after remove hooks', function (done) {
    // add before insert hooks
    _this.testCol.before('remove', function (query) {
      expect(query.firstName).toBe('');
      query.firstName = 'Yacine';
      return query;
    });

    _this.testCol.before('remove', function (object) {
      expect(object.firstName).toBe('Yacine');
      return object;
    });

    // add after insert hooks
    _this.testCol.after('remove', function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      return mongObject;
    });

    _this.testCol.after('remove', function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      return mongObject;
    });

    _this.testCol.remove({ firstName: '' })
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
    })
    .then(done);
  });
});
