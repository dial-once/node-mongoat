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

      // add before update hooks
      _this.testCol.before('update', function (object) {
        expect(typeof object).toBe('object');
        return object;
      });

      _this.testCol.before('update', function (object) {
        expect(typeof object).toBe('object');
        return object;
      });

      // add after update hooks
      _this.testCol.after('update', function (object) {
        expect(typeof object).toBe('object');
        return object;
      });

      _this.testCol.after('update', function (object) {
        expect(typeof object).toBe('object');
        return object;
      });

      done();
    });
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol = _this.testDb.collection('Person.verioning.vermongo');
    
    _this.testCol.find()
    .toArray()
    .then(function (mongoArray) {
      expect(mongoArray.length).toBe(7);
      
      _this.testDb.dropDatabase();
      _this.testDb.close();
      
      done();
    });
  });

  // test restore
  it('should throw error',
  function (done) {
   _this.testCol.restore(-2)
    .catch(function (err) {
      expect(typeof err).toBe('object');
      expect(err.message).toBe('Nothing to restore');
      
      done();
    });
  });

  // test insert
  it('should insert new document to collection',
  function (done) {
    _this.testCol.insert({
      firstName: 'Hichem',
      lastName: 'KHATAl',
      age: 28
    }).then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      done();
    });
  });


  // test upsert
  it('should upsert new document to collection',
  function (done) {
    _this.testCol.update(
      { firstName: 'Yacine' },
      { $setOnInsert: { lastName: 'KHATAL', age: 25 } },
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

  // test update
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

  // test update
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

  // test restore
  it('should restore version 1 of the document by version',
  function (done) {
    _this.testCol.restore(-7)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(25);
      expect(mongObject.job).toBeUndefined();
      expect(mongObject.company).toBeUndefined();
      
      done();
    });
  });

  // test restore
  it('should restore version 3 document by version',
  function (done) {
    _this.testCol.restore(3)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(35);
      expect(mongObject.job).toBe('software engineer');
      expect(mongObject.company).toBe('Dial Once');
      
      done();
    });
  });

  // test restore
  it('should restore version 2 document by version',
  function (done) {
    _this.testCol.restore(2)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(30);
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject.job).toBeUndefined();
      
      done();
    });
  });

  // test restore
  it('should restore last version of the document by version',
  function (done) {
    _this.testCol.restore(0)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(35);
      expect(mongObject.job).toBe('software engineer');
      expect(mongObject.company).toBe('Dial Once');
      
      done();
    });
  });

  // test restore
  it('should restore version -2 of the document by version',
  function (done) {
    _this.testCol.restore(-2)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(25);
      expect(mongObject.job).toBeUndefined();
      expect(mongObject.company).toBeUndefined();
      
      done();
    });
  });
});
