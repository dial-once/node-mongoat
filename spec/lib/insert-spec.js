'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;

describe('Insert', function() {
  // connect to db before all tests
  beforeAll(function(done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/test')
    .then(function (db) {
      db.dropDatabase();
      _this.testDb = db;
      _this.testCol = db.collection('Person');
      done();
    });
  });

  // close db after all tests
  afterAll(function() {
    if (_this.testDb) {
      _this.testDb.close();
    }
  });

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

  describe('Insert with before hooks', function() {
    // test only one before insert hook
    it('should insert new document to Person collection and handle before insert hook',
    function (done) {
      // add before insert hook
      _this.testCol.before('insert', function (object) {
        object.job = 'software engineer';
        return object;
      });

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

    // test multiple before insert hooks
    it('should insert new document to Person collection and handle before insert hooks',
    function (done) {
      // add before insert hooks
      _this.testCol.before('insert', function (object) {
        object.email = 'khatal.yacine@gmail.com';
        return object;
      });

      _this.testCol.before('insert', function (object) {
        object.company = 'Dial Once';
        return object;
      });

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
  });

  describe('Insert with after hooks', function() {
    // test only one before insert hook
    it('should insert new document to Person collection and handle after insert hook',
    function (done) {
      // add after insert hook
      _this.testCol.after('insert', function (object) {
        expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
        return object;
      });

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

    // test multiple after insert hooks
    it('should insert new document to Person collection and handle after insert hooks',
    function (done) {
      // add before insert hooks
      _this.testCol.after('insert', function (object) {
         expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
        return object;
      });

      _this.testCol.after('insert', function (object) {
        expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
        return object;
      });

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
  });
});
