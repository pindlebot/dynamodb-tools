const Params = require('./Params')
const DynamoDbClient = require('./DynamoDbClient')

class DynamoDbTools extends Params {
  constructor (awsConfig = { region: 'us-east-1' }) {
    super()
    this.AwsConfig = awsConfig
    this.client = DynamoDbClient(this.AwsConfig)
  }

  setAttribute (type, data) {
    const char = type.endsWith('Names') ? '#' : ':'
    this._params[type] = Object.keys(data).reduce((acc, key) => {
      acc[char + key] = char === ':' ? data[key] : key
      return acc
    }, {})
  }

  setExpression (
    key,
    data,
    opts = {
      separator: ' AND '
    }) {
    const expression = Object.keys(data)
      .map(k => `#${k} = :${k}`)
      .join(opts.separator)

    this._params[key] = opts.clause
      ? [opts.clause, expression].join(' ') : expression
  }

  getGlobalSecondaryIndex (data = {}) {
    const keys = Object.keys(data)
    if (!keys.length) return undefined
    const { GlobalSecondaryIndexes } = this.cache[this._params.TableName]
    if (!GlobalSecondaryIndexes) return undefined

    return GlobalSecondaryIndexes.find(({ KeySchema }) =>
      KeySchema.find(({ AttributeName }) =>
        keys.includes(AttributeName)
      )
    )
  }

  async set (...args) {
    const { data } = await this.format(...args)

    if (Object.keys(data).length) {
      this.setAttribute('ExpressionAttributeNames', data)
      this.setAttribute('ExpressionAttributeValues', data)
      this._params.ReturnValues = 'ALL_NEW'
      this.setExpression(
        'UpdateExpression',
        data,
        { separator: ', ', clause: 'SET' }
      )
    }

    return this.value('updateItem')
  }

  async get (...args) {
    await this.format(...args)
    const globalSecondaryIndex = this.getGlobalSecondaryIndex(this.data)
    let operation = typeof globalSecondaryIndex !== 'undefined'
      ? 'query'
      : this._params.Key
        ? 'get'
        : 'scan'

    if (
      operation !== 'get' &&
      Object.keys(this.data).length
    ) {
      this.setAttribute('ExpressionAttributeNames', this.data)
      this.setAttribute('ExpressionAttributeValues', this.data)
      if (operation === 'query') {
        this._params.IndexName = globalSecondaryIndex.IndexName
        this.setExpression('KeyConditionExpression', this.data)
      } else {
        this.setExpression('FilterExpression', this.data)
      }
    }

    return this.value(operation)
  }

  remove (...args) {
    return this.format(...args).then(() =>
      this.value('deleteItem')
    )
  }

  value (operation) {
    let params = { ...this._params }
    Object.assign(this, database.apply(DynamoDbTools, this.AwsConfig))
    // this._params = {
    //  TableName: params.TableName
    // }
    // this.data = {}
    return this.client[operation](params)
      .then(data => {
        if (
          operation === 'get' &&
          (typeof data === 'undefined' || !Object.keys(data).length)
        ) {
          return Promise.reject(new Error('unknown record'))
        }
        return data
      })
  }
}

function database (...args) {
  return new DynamoDbTools(...args)
}

database.database = database

DynamoDbTools.prototype.database = function (...args) {
  return database.apply(DynamoDbTools, args)
}

DynamoDbTools.database = database

module.exports = database
