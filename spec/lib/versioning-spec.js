'use strict';

// modules dependencies
var mongoat = require('../../index');

var _this;
var id;

// test update method
describe('Versioning', function () {
  // connect to db before all tests
  beforeAll(function (done) {
    _this = this;

    mongoat.MongoClient.connect('mongodb://localhost:27017/mongoatTest')
    .then(function (db) {
      _this.testDb = db;
      return db.dropDatabase();
    })
    .then(function () {
      _this.testCol = _this.testDb.collection('Person.verioning');
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
    })
    .then(done);
  });

  // close db after all tests
  afterAll(function (done) {
    _this.testCol = _this.testDb.collection('Person.verioning.vermongo');
    _this.testCol.find().toArray()
    .then(function (mongoArray) {
      expect(mongoArray.length).toBe(7);
    })
    .then(function () {
      _this.testDb.dropDatabase();
    })
    .then(function () {
      _this.testDb.close();
    })
    .then(done);
  });

  // test getVersion
  it('should throw error, because of id undefined', function (done) {
    try {
      _this.testCol.getVersion();
    } catch(err) {
      expect(err.message).toBe('The provided id is null or undefined');
      done();
    }
  });

  // test restore
  it('should throw error, because of id undefined', function (done) {
    try {
      _this.testCol.restore();
    } catch(err) {
      expect(err.message).toBe('The provided id is null or undefined');
      done();
    }
  });

  // test insert
  it('should insert new document to collection', function (done) {
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
      id = mongObject.ops[0]._id;
    })
    .then(done);
  });


  // test upsert
  it('should upsert new document to collection', function (done) {
    _this.testCol.update(
      { firstName: 'Hichem' },
      { $setOnInsert: { lastName: 'KHATAL', age: 28 } },
      { upsert: true }
    )
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(0);
    })
    .then(done);
  });

  // test update
  it('should update document from collection', function (done) {
    _this.testCol.update(
      { firstName: 'Yacine' },
      { $set: { age: 30, company: 'Dial Once' } }
    )
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(1);
    })
    .then(done);
  });

  // test update
  it('should update document from collection', function (done) {
    _this.testCol.update(
      { firstName: 'Yacine' },
      { $set: { age: 35, job: 'software engineer' } }
    )
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
      expect(mongObject.result.nModified).toBe(1);
    })
    .then(done);
  });

  // test getVersion
  it('should return null', function (done) {
    _this.testCol.getVersion(id, -7)
    .then(function (mongObject) {
      expect(mongObject).toBe(null);
    })
    .then(done);
  });

  // test restore
  it('should throw error', function (done) {
    _this.testCol.restore(id, -7)
    .catch(function (err) {
      expect(err.message).toBe('The requested version doesn\'t exist');
    })
    .then(done);
  });

  // test getVersion
  it('should get version 2 of the document by version and id', function (done) {
    _this.testCol.getVersion(id, 2)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(30);
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject.job).toBeUndefined();
      expect(mongObject._version).toBe(2);
    })
    .then(done);
  });

  // test restore
  it('should restore version 2 of the document by version and id', function (done) {
    _this.testCol.restore(id, 2)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(30);
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject.job).toBeUndefined();
      expect(mongObject._version).toBe(4);
    })
    .then(done);
  });

  // test getVersion
  it('should get version 3 of the document by version and id', function (done) {
    _this.testCol.getVersion(id, 3)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(35);
      expect(mongObject.job).toBe('software engineer');
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject._version).toBe(3);
    })
    .then(done);
  });

  // test restore
  it('should restore version 3 of the document by version and id', function (done) {
    _this.testCol.restore(id, 3)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(35);
      expect(mongObject.job).toBe('software engineer');
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject._version).toBe(5);
    })
    .then(done);
  });

  // test getVersion
  it('should get last version of the document by version and id', function (done) {
    _this.testCol.getVersion(id, 0)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(30);
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject.job).toBeUndefined();
      expect(mongObject._version).toBe(4);
    })
    .then(done);
  });

  // test restore
  it('should restore last version of the document by version and id', function (done) {
    _this.testCol.restore(id, 0)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(30);
      expect(mongObject.company).toBe('Dial Once');
      expect(mongObject.job).toBeUndefined();
      expect(mongObject._version).toBe(6);
    })
    .then(done);
  });

  // test getVersion
  it('should get version -2 of the document by version and id', function (done) {
    _this.testCol.getVersion(id, -4)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(25);
      expect(mongObject.job).toBeUndefined();
      expect(mongObject.company).toBeUndefined();
      expect(mongObject._version).toBe(1);
    })
    .then(done);
  });

  // test restore
  it('should restore version -2 of the document by version and id', function (done) {
    _this.testCol.restore(id, -4)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(25);
      expect(mongObject.job).toBeUndefined();
      expect(mongObject.company).toBeUndefined();
      expect(mongObject._version).toBe(7);
    })
    .then(done);
  });

  // test remove
  it('should remove document from collection', function (done) {
    _this.testCol.remove({ firstName: 'Yacine' })
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(typeof mongObject.result).toBe('object');
      expect(mongObject.result.ok).toBe(1);
      expect(mongObject.result.n).toBe(1);
    })
    .then(done);
  });

  // test getVersion
  it('should restore last version of the document by id', function (done) {
    _this.testCol.getVersion(id)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(25);
      expect(mongObject.job).toBeUndefined();
      expect(mongObject.company).toBeUndefined();
      expect(mongObject._version).toBe('deleted:7');
    })
    .then(done);
  });

  // test restore
  it('should restore last version of the document by id', function (done) {
    _this.testCol.restore(id)
    .then(function (mongObject) {
      expect(typeof mongObject).toBe('object');
      expect(mongObject.firstName).toBe('Yacine');
      expect(mongObject.lastName).toBe('KHATAL');
      expect(mongObject.age).toBe(25);
      expect(mongObject.job).toBeUndefined();
      expect(mongObject.company).toBeUndefined();
      expect(mongObject._version).toBe(8);
    })
    .then(done);
  });
});
