const Base = require('./Base')
const DynamoDbClient = require('./DynamoDbClient')

class DynamoDbTools extends Base {
  constructor (
    awsConfig = { region: 'us-east-1' },
    options = {
      meta: false,
      prefix: '',
      dryRun: false,
      plugins: {}
    }
  ) {
    super()

    this.AwsConfig = awsConfig
    this.opts = options
    this.opts.prefix = options.prefix || ''
    this.client = DynamoDbClient(this.AwsConfig)
    this.opts.plugins = options.plugins || {}
  }

  setAttribute (type, props) {
    const char = type === 'ExpressionAttributeNames' ? '#' : ':'
    const pairs = {}
    for (let key in props) {
      pairs[char + key] = char === ':' ? props[key] : key
    }

    this.params[type] = pairs
  }

  setExpression (
    key,
    props,
    opts = {
      separator: ' AND '
    }) {
    const expression = Object.keys(props)
      .map(k => `#${k} = :${k}`)
      .join(opts.separator)

    this.params[key] = opts.clause
      ? [opts.clause, expression].join(' ') : expression
  }

  getGlobalSecondaryIndex (props) {
    if (!(props && Object.keys(props).length)) return undefined
    const tableName = this.params.TableName
    const table = this.cache[tableName]
    if (!table.GlobalSecondaryIndexes) return undefined

    const globalSecondaryIndex = table.GlobalSecondaryIndexes.find(index =>
      index.KeySchema.find(schema =>
        Object.keys(props).includes(schema.AttributeName)
      )
    )

    return globalSecondaryIndex
  }

  async set (...args) {
    const { props } = await this.prepare(...args)

    if (props && Object.keys(props).length) {
      this.setAttribute('ExpressionAttributeNames', props)
      this.setAttribute('ExpressionAttributeValues', props)
      this.params.ReturnValues = 'ALL_NEW'
      this.setExpression(
        'UpdateExpression',
        props,
        { separator: ', ', clause: 'SET' }
      )
    }

    this.state.operation = 'updateItem'
    console.log(this)
    return this.value()
  }

  async get (...args) {
    const { props } = await this.prepare(...args)
    const globalSecondaryIndex = this.getGlobalSecondaryIndex(props)

    if (typeof globalSecondaryIndex !== 'undefined') {
      this.state.operation = 'query'
    } else if (this.params.Key) {
      this.state.operation = 'get'
    } else {
      this.state.operation = 'scan'
    }

    if (
      this.state.operation === 'scan' &&
      props && Object.keys(props).length
    ) {
      this.setAttribute('ExpressionAttributeNames', props)
      this.setAttribute('ExpressionAttributeValues', props)
      this.setExpression('FilterExpression', props)
    }

    return this.value()
  }

  async remove (...args) {
    const props = await this.prepare(...args)

    this.state.operation = 'deleteItem'
    return this.value()
  }

  use (plugin, name) {
    if (typeof plugin === 'function') {
      this.opts.plugins[name || plugin.name] = plugin
    }

    return this
  }

  async value () {
    if (this.opts.dryRun) return this
    const params = this.params
    const operationType = this.state.operation

    const operation = () =>
      this.client[operationType](params, { meta: this.opts.meta })
    const keys = Object.keys(this.opts.plugins || {})
    let results = []
    while (keys.length) {
      let pluginName = keys.shift()
      let plugin = this.opts.plugins[pluginName]
      let result = await plugin(params, operation.bind(this))
      results.push(result)
    }

    return results.length
      ? results
      : operation()
  }
}

function database (...args) {
  return new DynamoDbTools(...args)
}

database.database = database

DynamoDbTools.prototype.database = function (...args) {
  if (!args.length) {
    args = [this.AwsConfig, this.opts]
  }

  return database.apply(DynamoDbTools, args)
}

DynamoDbTools.database = database

module.exports = database
