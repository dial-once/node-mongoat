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
});
