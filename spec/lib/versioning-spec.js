'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;

// test update method
describe('Versioning', function () {
  // connect to db before all tests
  beforeAll(function (done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/mongoatTest')
    .then(function (db) {
      db.dropDatabase();
      _this.testDb = db;
      _this.testCol = db.collection('Person.verioning');
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
      // _this.testDb.dropDatabase();
      _this.testDb.close();
      
      done();
    });
  });

  // test insert without hooks
  it('should insert new document to collection',
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

  // test update without hooks
  it('should update document from collection',
  function (done) {
    _this.testCol.update(
      { firstName: 'Yacine' },
      { $set: { age: 30, company: 'Dial Once' } }
    ).then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(1);
      
      done();
    });
  });

  // test update without hooks
  it('should update document from collection',
  function (done) {
    _this.testCol.update(
      { firstName: 'Yacine' },
      { $set: { age: 35, job: 'software engineer' } }
    ).then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(1);
      
      done();
    });
  });

  // test restore without hooks
  it('should restore version 1 of the document by version',
  function (done) {
    _this.testCol.restore(-7)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAl');
      expect(mongObject.age).toBe(25);
      expect(mongObject.job).toBeUndefined();
      expect(mongObject.company).toBeUndefined();
      
      done();
    });
  });

  // test restore without hooks
  it('should restore version 3 document by version',
  function (done) {
    _this.testCol.restore(3)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAl');
      expect(mongObject.age).toBe(35);
      expect(mongObject.job).toBe('software engineer');
      expect(mongObject.company).toBe('Dial Once');
      
      done();
    });
  });

  // test restore without hooks
  it('should restore version 2 document by version',
  function (done) {
    _this.testCol.restore(2)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAl');
      expect(mongObject.age).toBe(30);
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject.job).toBeUndefined();
      
      done();
    });
  });

  // test restore without hooks
  it('should restore last version of the document by version',
  function (done) {
    _this.testCol.restore(0)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAl');
      expect(mongObject.age).toBe(35);
      expect(mongObject.job).toBe('software engineer');
      expect(mongObject.company).toBe('Dial Once');
      
      done();
    });
  });

  // test restore without hooks
  it('should restore version -2 of the document by version',
  function (done) {
    _this.testCol.restore(-2)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAl');
      expect(mongObject.age).toBe(25);
      expect(mongObject.job).toBeUndefined();
      expect(mongObject.company).toBeUndefined();
      
      done();
    });
  });
});
