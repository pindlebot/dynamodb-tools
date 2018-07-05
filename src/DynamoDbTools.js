const Params = require('./Params')
const DynamoDbClient = require('./DynamoDbClient')

class DynamoDbTools extends Params {
  constructor (
    awsConfig = { region: 'us-east-1' }
  ) {
    super()

    this.AwsConfig = awsConfig
    this.client = DynamoDbClient(this.AwsConfig)
  }

  setAttribute (type, data) {
    const char = type.endsWith('Names') ? '#' : ':'
    this.params[type] = Object.keys(data).reduce((acc, key) => {
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

    this.params[key] = opts.clause
      ? [opts.clause, expression].join(' ') : expression
  }

  getGlobalSecondaryIndex (data = {}) {
    const keys = Object.keys(data)
    if (!keys.length) return undefined
    const { GlobalSecondaryIndexes } = this.cache[this.params.TableName]
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
      this.params.ReturnValues = 'ALL_NEW'
      this.setExpression(
        'UpdateExpression',
        data,
        { separator: ', ', clause: 'SET' }
      )
    }

    return this.value('updateItem')
  }

  async get (...args) {
    const { data } = await this.format(...args)
    const globalSecondaryIndex = this.getGlobalSecondaryIndex(data)

    let operation = typeof globalSecondaryIndex !== 'undefined'
      ? 'query'
      : this.params.Key
        ? 'get'
        : 'scan'

    if (
      operation === 'scan' &&
      Object.keys(data).length
    ) {
      this.setAttribute('ExpressionAttributeNames', data)
      this.setAttribute('ExpressionAttributeValues', data)
      this.setExpression('FilterExpression', data)
    }

    return this.value(operation)
  }

  remove (...args) {
    return this.format(...args).then(() =>
      this.value('deleteItem')
    )
  }

  value (operation) {
    let TableName = this.params.TableName.slice(0)
    return this.client[operation](this.params)
      .then(data => {
        Object.assign(this, database.apply(DynamoDbTools, this.AwsConfig))
        this.params.TableName = TableName
        return data.length && data.length === 1
          ? data[0]
          : data
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
