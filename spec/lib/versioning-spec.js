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
      { $set: { age: 30 } }
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
  it('should restore document by version',
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

  // test update without hooks
  it('should upsert new document to collection',
  function (done) {
    _this.testCol.restore(-7)
    .then(function (mongObject) {
      console.log('mongObject:', mongObject);
      // expect(typeof mongObject).toBe('object');
      // expect(typeof mongObject.result).toBe('object');
      // expect(mongObject.result.ok).toBe(1);
      // expect(mongObject.result.n).toBe(1);
      // expect(mongObject.result.nModified).toBe(1);
      
      done();
    });
  });

  // // test with multiple before and after update hooks
  // it('should update document from Person collection and handle before and after update hooks',
  // function (done) {
  //   // add before update hooks
  //   _this.testCol.before('update', function (object) {
  //     expect(object.$set.job).toBe('software engineer');
  //     return object;
  //   });

  //   _this.testCol.before('update', function (object) {
  //     expect(object.$set.job).toBe('software engineer');
  //     object.$set.company = 'Dial Once';
  //     return object;
  //   });

  //   // add after update hooks
  //   _this.testCol.after('update', function (object) {
  //     expect(object.$set.job).toBe('software engineer');
  //     expect(object.$set.company).toBe('Dial Once');
  //     return object;
  //   });

  //   _this.testCol.after('update', function (object) {
  //     expect(object.$set.job).toBe('software engineer');
  //     expect(object.$set.company).toBe('Dial Once');
  //     return object;
  //   });

  //   _this.testCol.update(
  //     { firstName: 'Yacine' },
  //     { $set: { job: 'software engineer' } }
  //   ).then(function (mongObject) {
  //     expect(typeof mongObject).toBe('object');
  //     expect(typeof mongObject.result).toBe('object');
  //     expect(mongObject.result.ok).toBe(1);
  //     expect(mongObject.result.n).toBe(1);
  //     expect(mongObject.result.nModified).toBe(1);
      
  //     done();
  //   });
  // });
});
