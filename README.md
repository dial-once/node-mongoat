# Mongoat  

[![Codacy Badge](https://api.codacy.com/project/badge/grade/4e5e6d2ce3594a58ab1e8bd6e8ec0e1e)](https://www.codacy.com/app/dialonce/node-mongoat) [![Codacy Badge](https://api.codacy.com/project/badge/coverage/4e5e6d2ce3594a58ab1e8bd6e8ec0e1e)](https://www.codacy.com/app/dialonce/node-mongoat) ![dev dependencies](https://david-dm.org/dial-once/node-mongoat.svg) [![Inline docs](http://inch-ci.org/github/dial-once/node-mongoat.svg?branch=master)](http://inch-ci.org/github/dial-once/node-mongoat)

![mongoat gif](./medias/mongoat.gif)


## Description
Mongoat is a [MongoDB](https://www.mongodb.org/) lightweight wrapper adding hooks (pre/post), automatic createdAt/updatedAt, in a native MongoDB experience. It is written on top of the [mongodb npm package](https://github.com/mongodb/node-mongodb-native).

It does not provides any ODM, model specifications, validation, or things that would force you to use it in a specific way. Mongoat is designed to be used in a MongoDB way: your way.

## Features
- Hooks (pre/post actions: afterSave, beforeSave, etc.)
- Datetime documents easily (createdAt & updatedAt)
- Native MongoDB experience and usage (you actually use the native MongoDB driver when you use Mongoat)
- Versions documents easily (Vermongo specifications)

## ToDo:
  - Event triggering on oplog actions

## Installation
```
npm install mongoat
```

## Basic usage
```javascript
var mongoat = require('mongoat'); //instead of require('mongodb');
```
And then your ``mongoat`` object is to be used like the MongoDB native node.js driver. We just add some features on top of it, see below:

## Hooks
You can add multiple before and after hooks for insertions, updates and removals:

### before hooks:
```javascript
db.collection('collectionName').before('insert', function (docToInsert) {
  // triggered when calling to insert()
});

db.collection('collectionName').before('update', function (docToUpdate) {
  // triggered when calling to update() or findAndModify()
});

db.collection('collectionName').before('remove', function (docToRemove) {
  // triggered when calling to remove()
}); 
```
### after hooks:
```javascript
db.collection('collectionName').after('insert', function (docToInsert) {
  // triggered when calling to insert()
});

db.collection('collectionName').after('update', function (docToUpdate) {
  // triggered when calling to update() or findAndModify()
});

db.collection('collectionName').after('remove', function (docToRemove) {
  // triggered when calling to remove()
}); 
```


## Datetime
Enable datetime feature:
```javascript
db.collection('collectionName').datetime(true); // Default is false
```

### createdAt:
it will add a `createdAt` field to all new inserted documents using:
```javascript
db.collection('collectionName').insert(document, options);
```
or using one of the following method within the option `upsert: ture`
```javascript
db.collection('collectionName').update(query, update, options);
db.collection('collectionName').findAndModify(query, sort, update, options);
```

### updatedAt:
it will add a `updatedAt` field to all updated documents using:
```javascript
db.collection('collectionName').update(query, update, options);
// or
db.collection('collectionName').findAndModify(query, sort, update, options);
```

## Versioning
Enable versioning feature:
```javascript
db.collection('collectionName').version(true); // Default is false
```
Enabling this feature for a collection, so each time you perform an insert/update/remove it will create a document in the collection collectionName.vermongo and increment the version of the updated document. The `_id` in this collection is a composite ID, `{ _id: _id, _version: _version }`. 
The document in the MyCollection collection will also receive a _version field.

If we want to restore a version
```javascript
db.collection('collectionName').restore(id, version);
```

* id of the document to restore is required
* if version is greater than 0, it will be considered as the version to restore
* if version is equal or lower than 0, it will be considered as the starting 
* if version is not provided, it will takes default value 0
point of the version to restore (starting form last) ex:

```javascript
db.collection('collectionName').restore(id, 0); // restore the last version
```

```javascript
db.collection('collectionName').restore(id, -2); // restore the last version -2
```

more about versioning feature [here](https://github.com/thiloplanz/v7files/wiki/Vermongo)

## Tests
1. Run a MongoDb server if not yet
2. Run tests ``` npm test```

Or to show up code coverage ``` npm run cover ```
it will generate ``` ./coverage ``` folder

## Contribution
Please read our [Contributing Guidlines](CONTRIBUTING.md) before submitting a pull request or an issue !

## License
The MIT License [MIT](LICENSE)

Copyright (c) 2015 Dial Once



