# dynamodb-tools [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

```bash
npm i dynamodb-tools --save
```

```js

const dynamo = require('dynamodb-tools')
const config = { region: 'us-east-1' }
const opts = {}
const db = new dynamo.Db(config, opts)

````

## Methods

### `get(path, [obj])`

`get` fetches record(s) from a DynamoDb table.

**Arguments**

- path: `{tableName}` or `{tableName}.{recordId}`
- obj (optional): properties to match records against. 
  - If your table has global secondary indices, this method will use [query](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-query-scan.html). Otherwise, this method will scan. 

Note: A record ID can be specified in either the path (`{tableName}.{ID}`) or object (`{ id }`) parameters.

#### Examples

```js

const dynamo = require('dynamodb-tools')
const db = new dynamo.Db({region: 'us-east-1'})

db.get('orders').then(resp => {
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

db.get('orders.1c8deb5013d6e49a').then(resp => {
  console.log(resp)
})

// => {
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }


db.get('orders', { id: '1c8deb5013d6e49a' }).then(resp => {
  console.log(resp)
})

// => {
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }


db.get('orders', { user: 'e67f846dc4b067d9fa6c9a8eda72f7de' }).then(resp => {
  console.log(resp)
})

// => {
//  user: 'e67f846dc4b067d9fa6c9a8eda72f7de',
//  id: '1c8deb5013d6e49a',
// }

```

### `set(path, obj)`

`Set` creates a record or updates an existing record. 

- path: `{tableName}` or `{tableName}.{recordId}`
- obj: object to create or update

#### Examples

```js
const dynamo = require('dynamodb-tools')
const db = new dynamo.Db({region: 'us-east-1'})

db.set('orders.4d5ea3eddd26b469').then(resp => {
  console.log(resp)
})

// => { id: '4d5ea3eddd26b469' }

db.set('orders.4d5ea3eddd26b469', { user: '408926c6a868bca6529fee1acf7f81cb' }) 
 .then(resp => {
    console.log(resp)
  })

// => { id: '4d5ea3eddd26b469', user: '408926c6a868bca6529fee1acf7f81cb' }
```

### `remove(path, [obj])`

`remove` deletes record(s) from a DynamoDb table.

**Arguments**

- path: `{tableName}.{recordId}`
- obj (optional): properties to match records against. 

#### Examples

```js

const dynamo = require('dynamodb-tools')
const db = new dynamo.Db({region: 'us-east-1'})

const table = 'orders'
const id = '4d5ea3eddd26b469'

db.remove(`${table}.${id}`)
  .then(resp => console.log(resp))

db.remove(table, { id })
  .then(resp => console.log(resp))

// WARNING: deletes all records in a table
db.remove(table)
  .then(resp => console.log(resp))

```


[npm-image]: https://badge.fury.io/js/dynamodb-tools.svg
[npm-url]: https://npmjs.org/package/dynamodb-tools
[travis-image]: https://travis-ci.org/focuswish/dynamodb-tools.svg?branch=master
[travis-url]: https://travis-ci.org/focuswish/dynamodb-tools
[daviddm-image]: https://david-dm.org/focuswish/dynamodb-tools.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/focuswish/dynamodb-tools
[coveralls-image]: https://coveralls.io/repos/focuswish/dynamodb-tools/badge.svg
[coveralls-url]: https://coveralls.io/r/focuswish/dynamodb-tools