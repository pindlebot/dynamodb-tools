# dynamodb-tools [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

```bash
npm i dynamodb-tools --save
```

```js

const dynamo = require('dynamodb-tools').db()

```

## Methods

### `get()`

Returns all records in a table (scan operation).

### `get(id: string)`

Returns a record in a table (get operation).

### `get({ id: 'value' }: object)`

Returns records that match the data provided.
 - `get({ id: 'recordId' })` performs a get operation and returns a single record. Equivalent to `get('recordId')`.
 - `get({ age: 15 })` performs a scan operation or query operation (if global secondary indices are configured)

#### Examples

```js

const db = require('dynamodb-tools')
  .db({ region: 'us-east-1' })
  .table('orders')

db.get().then(resp => {
  console.log(resp)
})

// => [{
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }, {
//   user: 'a695f8374eb2e8c064c31e00dcb8871f',
//  id: 'ac76afd07e3aaa58',
// }, {
//  ...
// }]

db.get('1c8deb5013d6e49a').then(resp => {
  console.log(resp)
})

// => {
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }

db.get({ id: '1c8deb5013d6e49a' }).then(resp => {
  console.log(resp)
})

// => {
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }

// match all records in the provided table with user = 'e67f846dc4b067d9fa6c9a8eda72f7de'
db.get({ user: 'e67f846dc4b067d9fa6c9a8eda72f7de' }).then(resp => {
  console.log(resp)
})

// => {
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }

```

### `set(id: string)`

Create a new record with the provided id.

### `set({ id: '4d5ea3eddd26b469' })

Equivalent to the above.

### `set('4d5ea3eddd26b469', data)

Create or update a record with an id and provided properties.

### `set({ id: '4d5ea3eddd26b469', ...data })

Equivalent to the above.

#### Examples

```js
const db = require('dynamodb-tools')
  .db({ region: 'us-east-1' })
  .table('orders')

db.set({ id: '4d5ea3eddd26b469' }).then(resp => {
  console.log(resp)
})

// => { id: '4d5ea3eddd26b469' }

db.set('4d5ea3eddd26b469', { user: '408926c6a868bca6529fee1acf7f81cb' }) 
 .then(resp => {
    console.log(resp)
  })

// => { id: '4d5ea3eddd26b469', user: '408926c6a868bca6529fee1acf7f81cb' }
```

### `remove(id)`

`remove` deletes record(s) from a DynamoDb table.

#### Examples

```js

const db = require('dynamodb-tools')
  .db({ region: 'us-east-1' })
  .table('orders')

db.remove('4d5ea3eddd26b469')
  .then(resp => console.log(resp))

db.remove({ id: '4d5ea3eddd26b469' })
  .then(resp => console.log(resp))

```


[npm-image]: https://badge.fury.io/js/dynamodb-tools.svg
[npm-url]: https://npmjs.org/package/dynamodb-tools
[travis-image]: https://travis-ci.org/unshift/dynamodb-tools.svg?branch=master
[travis-url]: https://travis-ci.org/unshift/dynamodb-tools
[daviddm-image]: https://david-dm.org/unshift/dynamodb-tools.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/unshift/dynamodb-tools
[coveralls-image]: https://coveralls.io/repos/unshift/dynamodb-tools/badge.svg
[coveralls-url]: https://coveralls.io/r/unshift/dynamodb-tools