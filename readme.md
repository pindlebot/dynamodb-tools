# dynamodb-tools [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

```bash
npm i dynamodb-tools --save
```

```js

const tools = require('dynamodb-tools')
const db = tools(DYNAMODB_TABLE_NAME)

```

## Methods

`get()`

Returns all records in a table (scan operation).

`get({ id: 'value' }: object)`

Returns a record in a table (get operation).

Returns records that match the data provided.
 - `get({ id: 'recordId' })` performs a get operation and returns a single record.
 - `get({ age: 15 })` performs a scan or query operation. Prefers the query operation if global secondary indices are configured.

### Examples

```js
const db = require('dynamodb-tools')

db('users').get().then(console.log.bind(console))

// => [{
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }, {
//   user: 'a695f8374eb2e8c064c31e00dcb8871f',
//  id: 'ac76afd07e3aaa58',
// }, {
//  ...
// }]

db('users').get({ id: '1c8deb5013d6e49a' }).then(console.log.bind(console))

// => {
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }

// match all records in the provided table with user = 'e67f846dc4b067d9fa6c9a8eda72f7de'
db('users').get({ user: 'e67f846dc4b067d9fa6c9a8eda72f7de' })
  .then(console.log.bind(console))

// => {
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }

```
`set({ id: '4d5ea3eddd26b469' })`

Create a new record with the provided id.

### Examples

```js
const db = require('dynamodb-tools')

db('orders').set({ id: '4d5ea3eddd26b469' })
  .then(console.log.bind(console))

// => { id: '4d5ea3eddd26b469' }

db('orders').set({
  id: '4d5ea3eddd26b469'
  user: '408926c6a868bca6529fee1acf7f81cb'
})
 .then(console.log.bind(console))

// => { id: '4d5ea3eddd26b469', user: '408926c6a868bca6529fee1acf7f81cb' }
```

`remove({ id: 'value' })` 

Deletes the record with the provided id.

### Examples

```js
const db = require('dynamodb-tools')

db('orders').remove({ id: '4d5ea3eddd26b469' })
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