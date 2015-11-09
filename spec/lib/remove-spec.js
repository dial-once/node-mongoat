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
      db.dropDatabase();
      _this.testDb = db;
      _this.testCol = db.collection('Person.remove');
      _this.testCol.version(true);

      done();
    });
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol.find()
    .toArray()
    .then(function (mongoArray) {
      expect(mongoArray.length).toBe(0);

      _this.testDb.dropDatabase();
      _this.testDb.close();
      done();
    });
  });

  // test insert without hooks
  it('should insert new document to Person collection',
  function (done) {
    _this.testCol.insert({
      firstName: 'Yacine',
      lastName: 'KHATAl',
      age: 25
    }).then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      done();
    });
  });

  // test with multiple before and after insert hooks
  it('should remove document from Person collection and handle before and after insert hooks',
  function (done) {
    // add before insert hooks
    _this.testCol.before('remove', function (object) {
      expect(object.firstName).toBe('');
      object.firstName = 'Yacine';
      return object;
    });

    _this.testCol.before('remove', function (object) {
      expect(object.firstName).toBe('Yacine');
      return object;
    });

    // add after insert hooks
    _this.testCol.after('remove', function (object) {
      expect(object.firstName).toBe('Yacine');
      return object;
    });

    _this.testCol.after('remove', function (object) {
      expect(object.firstName).toBe('Yacine');
      return object;
    });

    _this.testCol.remove({
      firstName: '',
    }).then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      
      done();
    });
  });
});
