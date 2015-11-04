'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;

// test update method
describe('update', function() {
  // connect to db before all tests
  beforeAll(function (done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/mongoatTest')
    .then(function (db) {
      db.dropDatabase();
      _this.testDb = db;
      _this.testCol = db.collection('Person');

      _this.testCol.update(
        { firstName: 'Yacine' },
        { $setOnInsert: {
            lastName: 'KHATAl',
            job: 'software engineer',
            company: 'Dial Once',
            age: 25
          },
        },
        { upsert: true }
        ).then(function (mongObject) {
          expect(typeof mongObject).toBe('object');
          expect(typeof mongObject.result).toBe('object');
          expect(mongObject.result.ok).toBe(1);
          expect(mongObject.result.n).toBe(1);
          expect(mongObject.result.nModified).toBe(0);
          expect(typeof mongObject.result.upserted).toBe('object');
          expect(mongObject.result.upserted.length === 1).toBeTruthy();
          done();
      });
    });
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol.find()
    .toArray()
    .then(function (mongoArray) {
      // expect(mongoArray.length).toBe(6);

      // for (var i = 0; i < mongoArray.length; ++i) {
      //   expect(mongoArray[i].firstName).toBe('Yacine');
      //   expect(mongoArray[i].lastName).toBe('KHATAl');
      //   expect(mongoArray[i].age).toBe(25);

      //   if (i === 1) {
      //     expect(mongoArray[i].job).toBe('software engineer');
      //   } else if (i > 1) {
      //     expect(mongoArray[i].job).toBe('software engineer');
      //     expect(mongoArray[i].email).toBe('khatal.yacine@gmail.com');
      //     expect(mongoArray[i].company).toBe('Dial Once');
      //   }
      // }

      // _this.testDb.dropDatabase();
      _this.testDb.close();
      done();
    })
    .catch(function (err) {
      console.error(err);
      _this.testDb.close();
      done();
    });
  });

  // test update without hooks
  describe('update without hooks', function() {
    it('should update new document to Person collection',
      function (done) {
        _this.testCol.update(
        { firstName: 'Yacine' },
        { $set: {
            age: 26 
          },
        }
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

  // test before update hooks
  describe('update with before hooks', function() {
    // test only with one before update hook
    it('should update document from Person collection and handle before update hook',
    function (done) {
      // add before update hook
      _this.testCol.before('update', function (object) {
        expect(object.$set.age).toBe(26);
        object.$set.updatedAt = new Date();
        return object;
      });

      _this.testCol.update(
        { firstName: 'Yacine' },
        { $set: {
            age: 26 
          },
        }
      ).then(function (mongObject) {
        expect(typeof mongObject).toBe('object');
        expect(typeof mongObject.result).toBe('object');
        expect(mongObject.result.ok).toBe(1);
        expect(mongObject.result.n).toBe(1);
        expect(mongObject.result.nModified).toBe(1);
        done();
      });
    });

    // test with multiple before update hooks
    it('should update document from Person collection and handle before update hooks',
    function (done) {
      // add before update hooks
      _this.testCol.before('update', function (object) {
        expect(object.$set.age).toBe(26);
        _this.date = new Date();
        object.$set.updatedAt = _this.date;
        return object;
      });

      _this.testCol.before('update', function (object) {
        expect(object.$set.age).toBe(26);
        expect(object.$set.updatedAt).toBe(_this.date);
        object.$set.company = 'DialOnce';
        return object;
      });

      _this.testCol.update(
        { firstName: 'Yacine' },
        { $set: {
            age: 26 
          },
        }
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
  
  // test only with one after update hook
  describe('update with after hooks', function() {
    it('should update new document to Person collection and handle after update hook',
    function (done) {
      // add after update hook
      _this.testCol.after('update', function (object) {
        expect(object.$set.age).toBe(26);
        return object;
      });

      _this.testCol.update(
        { firstName: 'Yacine' },
        { $set: {
            age: 26 
          },
        }
      ).then(function (mongObject) {
        expect(typeof mongObject).toBe('object');
        expect(typeof mongObject.result).toBe('object');
        expect(mongObject.result.ok).toBe(1);
        expect(mongObject.result.n).toBe(1);
        expect(mongObject.result.nModified).toBe(1);
        done();
      });
    });

    // test with multiple after update hooks
    it('should update new document to Person collection and handle after update hooks',
    function (done) {
      // add after update hooks
      _this.testCol.after('update', function (object) {
        expect(object.$set.age).toBe(26);
        expect(object.$set.job).toBe('software engineer');
        return object;
      });

      _this.testCol.after('update', function (object) {
        expect(object.$set.age).toBe(26);
        expect(object.$set.job).toBe('software engineer');
        return object;
      });

      _this.testCol.update(
        { firstName: 'Yacine' },
        { $set: {
            age: 26,
            job: 'software engineer'
          },
        }
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

  // test with multiple before and after update hooks
  describe('update with before and after hooks', function() {
    it('should update new document to Person collection and handle before and after update hooks',
    function (done) {
      // add before update hooks
      _this.testCol.before('update', function (object) {
        expect(object.$set.age).toBe(26);
        _this.date = new Date();
        object.$set.updatedAt = _this.date;
        return object;
      });

      _this.testCol.before('update', function (object) {
        expect(object.$set.age).toBe(26);
        expect(object.$set.updatedAt).toBe(_this.date);
        object.$set.company = 'Dial Once';
        object.$set.job = 'software engineer';
        return object;
      });

      // add after update hooks
      _this.testCol.after('update', function (object) {
        expect(object.$set.age).toBe(26);
        expect(object.$set.job).toBe('software engineer');
        expect(object.$set.company).toBe('Dial Once');
        return object;
      });

      _this.testCol.after('update', function (object) {
        expect(object.$set.age).toBe(26);
        expect(object.$set.job).toBe('software engineer');
        expect(object.$set.company).toBe('Dial Once');
        return object;
      });

      _this.testCol.update(
        { firstName: 'Yacine' },
        { $set: {
            age: 26,
            job: 'developer'
          },
        }
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
});
