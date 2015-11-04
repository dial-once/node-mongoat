'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;

// test insert method
describe('Insert', function() {
  // connect to db before all tests
  beforeAll(function (done) {
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
  afterAll(function (done) {
    _this.testCol.find()
    .toArray()
    .then(function (mongoArray) {
      expect(mongoArray.length).toBe(6);

      for (var i = 0; i < mongoArray.length; ++i) {
        expect(mongoArray[i].firstName).toBe('Yacine');
        expect(mongoArray[i].lastName).toBe('KHATAl');
        expect(mongoArray[i].age).toBe(25);

        if (i === 1) {
          expect(mongoArray[i].job).toBe('software engineer');
        } else if (i > 1) {
          expect(mongoArray[i].job).toBe('software engineer');
          expect(mongoArray[i].email).toBe('khatal.yacine@gmail.com');
          expect(mongoArray[i].company).toBe('Dial Once');
        }
      }

      _this.testDb.dropDatabase();
      _this.testDb.close();
      done();
    })
    .catch(function (err) {
      console.error(err);
      _this.testDb.close();
      done();
    });
  });

  // test insert without hooks
  describe('Insert without hooks', function() {
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
  });

  // test only with one before insert hook
  describe('Insert with before hooks', function() {
    it('should insert new document to Person collection and handle before insert hook',
    function (done) {
      // add before insert hook
      _this.testCol.before('insert', function (object) {
        expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
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

    // test with multiple before insert hooks
    it('should insert new document to Person collection and handle before insert hooks',
    function (done) {
      // add before insert hooks
      _this.testCol.before('insert', function (object) {
        expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
        object.email = 'khatal.yacine@gmail.com';
        return object;
      });

      _this.testCol.before('insert', function (object) {
        expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
        expect(object.email).toBe('khatal.yacine@gmail.com');
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
  
  // test only with one after insert hook
  describe('Insert with after hooks', function() {
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

    // test with multiple after insert hooks
    it('should insert new document to Person collection and handle after insert hooks',
    function (done) {
      // add after insert hooks
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

  // test with multiple before and after insert hooks
  describe('Insert with before and after hooks', function() {
    it('should insert new document to Person collection and handle before and after insert hooks',
    function (done) {
      // add before insert hooks
      _this.testCol.before('insert', function (object) {
        expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
        object.email = 'khatal.yacine@gmail.com';
        return object;
      });

      _this.testCol.before('insert', function (object) {
        expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
        expect(object.email).toBe('khatal.yacine@gmail.com');
        object.company = 'Dial Once';
        return object;
      });

      // add after insert hooks
      _this.testCol.after('insert', function (object) {
        expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
        expect(object.email).toBe('khatal.yacine@gmail.com');
        expect(object.company).toBe('Dial Once');
        return object;
      });

      _this.testCol.after('insert', function (object) {
        expect(object.firstName).toBe('Yacine');
        expect(object.lastName).toBe('KHATAl');
        expect(object.age).toBe(25);
        expect(object.email).toBe('khatal.yacine@gmail.com');
        expect(object.company).toBe('Dial Once');
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
