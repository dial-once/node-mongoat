'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;

// test insert method
describe('Insert', function () {
  // connect to db before all tests
  beforeAll(function (done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/mongoatTest')
    .then(function (db) {
      _this.testDb = db;
      return db.dropDatabase();
    })
    .then(function () {
      _this.testCol = _this.testDb.collection('Person.insert');
      _this.testCol.datetime(true);
      _this.testCol.version(true);
    })
    .then(done);
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol.find().toArray()
    .then(function (mongoArray) {
      expect(mongoArray.length).toBe(3);

      for (var i = 0; i < mongoArray.length; ++i) {
        expect(mongoArray[i].firstName).toBe('Yacine');
        expect(mongoArray[i].lastName).toBe('KHATAL');
        expect(mongoArray[i].age).toBe(25);
        expect(mongoArray[i].createdAt).toBeDefined();
        if (i > 1) {
          expect(mongoArray[i].email).toBe('khatal.yacine@gmail.com');
          expect(mongoArray[i].company).toBe('Dial Once');
        }
      }
    })
    .then(function () {
      _this.testDb.dropDatabase();
    })
    .then(function () {
      _this.testDb.close();
    })
    .then(done);
  });

  // test insert without hooks
  it('should insert new document to collection', function (done) {
    _this.testCol.insert({
      firstName: 'Yacine',
      lastName: 'KHATAL',
      age: 25
    }, function (err, mongObject) {
      expect(err).toBe(null);
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      done();
    });
  });

  // test insert without hooks
  it('should insert new document to collection with static id', function (done) {
    _this.testCol.insert({
      _id: 'TEST_ID',
      firstName: 'Yacine',
      lastName: 'KHATAL',
      age: 25
    }, function (err, mongObject) {
      expect(err).toBe(null);
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      done();
    });
  });

  it('should not insert but throw error, using callback', function (done) {
    _this.testCol.insert({
      _id: 'TEST_ID',
      firstName: 'Yacine',
      lastName: 'KHATAL',
      age: 25
    }, function (err, mongObject) {
      expect(mongObject).toBe(null);
      expect(err).toBeDefined();
      done();
    });
  });

  it('should not insert but throw error, using promise', function (done) {
    _this.testCol.insert({
      _id: 'TEST_ID',
      firstName: 'Yacine',
      lastName: 'KHATAL',
      age: 25
    })
    .catch(function (err) {
      expect(err).toBeDefined();
    })
    .then(done);
  });

  // test with multiple before and after insert hooks
  it('should insert new document to collection and handle before and after insert hooks', function (done) {
    // add before insert hooks
    _this.testCol.before('insert', function (document) {
      expect(document.firstName).toBe('Yacine');
      expect(document.lastName).toBe('KHATAL');
      expect(document.age).toBe(25);
      document.email = 'khatal.yacine@gmail.com';
      return document;
    });

    _this.testCol.before('insert', function (document) {
      expect(document.firstName).toBe('Yacine');
      expect(document.lastName).toBe('KHATAL');
      expect(document.age).toBe(25);
      expect(document.email).toBe('khatal.yacine@gmail.com');
      document.company = 'Dial Once';
      return document;
    });

    // add after insert hooks
    _this.testCol.after('insert', function (mongObject) {
      expect(mongObject.ops[0].firstName).toBe('Yacine');
      expect(mongObject.ops[0].lastName).toBe('KHATAL');
      expect(mongObject.ops[0].age).toBe(25);
      expect(mongObject.ops[0].email).toBe('khatal.yacine@gmail.com');
      expect(mongObject.ops[0].company).toBe('Dial Once');
      return mongObject;
    });

    _this.testCol.after('insert', function (mongObject) {
      expect(mongObject.ops[0].firstName).toBe('Yacine');
      expect(mongObject.ops[0].lastName).toBe('KHATAL');
      expect(mongObject.ops[0].age).toBe(25);
      expect(mongObject.ops[0].email).toBe('khatal.yacine@gmail.com');
      expect(mongObject.ops[0].company).toBe('Dial Once');
      return mongObject;
    });

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
      expect(mongObject.ops[0].firstName).toBe('Yacine');
      expect(mongObject.ops[0].lastName).toBe('KHATAL');
      expect(mongObject.ops[0].age).toBe(25);
      expect(mongObject.ops[0].email).toBe('khatal.yacine@gmail.com');
      expect(mongObject.ops[0].company).toBe('Dial Once');
    })
    .then(done);
  });
});
