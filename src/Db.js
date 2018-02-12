const Base = require('./Base')
const { EnhancedMap, toJSON } = require('serialize-map')
const DynamoDbClient = require('./DynamoDbClient')

class Db extends Base {
  constructor (
    AwsConfig = {
      region: 'us-east-1'
    },
    opts = {}
  ) {
    super()
    this.plugins = EnhancedMap.create()
    this.client = DynamoDbClient(AwsConfig)
    this.opts = {}
    this.opts.meta = opts.meta || false
    this.opts.prefix = opts.prefix || ''
    this.opts.dryRun = opts.dryRun || false
  }

  setAttribute (type, props) {
    const char = type === 'ExpressionAttributeNames' ? '#' : ':'
    const pairs = {}
    for (let [k, v] of props) {
      pairs[char + k] = char === ':' ? (v instanceof Map ? toJSON(v) : v) : k
    }

    this.params.set(type, pairs)
  }

  setExpression (
    key,
    props,
    opts = {
      separator: ' AND '
    }) {
    const expression = [...props.keys()]
      .map(k => `#${k} = :${k}`)
      .join(opts.separator)

    this.params.set(key, opts.clause
      ? [opts.clause, expression].join(' ') : expression)
  }

  getGlobalSecondaryIndex (props) {
    if (!props.size) return undefined
    const tableName = this.params.get('TableName')
    const table = this.cache.get(tableName).toJSON()
    if (!table.GlobalSecondaryIndexes) return undefined

    let globalSecondaryIndex = table.GlobalSecondaryIndexes.find(index =>
      index.KeySchema.find(schema =>
        [...props.keys()].indexOf(schema.AttributeName) > -1
      )
    )

    return globalSecondaryIndex
  }

  async set (...args) {
    const { props } = await this.prepare(...args)

    if (props.size) {
      this.setAttribute('ExpressionAttributeNames', props)
      this.setAttribute('ExpressionAttributeValues', props)
      this.params.set('ReturnValues', 'ALL_NEW')
      this.setExpression(
        'UpdateExpression',
        props,
        { separator: ', ', clause: 'SET' }
      )
    }

    this.state.set('operation', 'updateItem')
    return this.value()
  }

  async get (...args) {
    const { props } = await this.prepare(...args)
    const globalSecondaryIndex = this.getGlobalSecondaryIndex(props)

    if (typeof globalSecondaryIndex !== 'undefined') {
      this.state.set('operation', 'query')
    } else if (this.params.has('Key')) {
      this.state.set('operation', 'get')
    } else {
      this.state.set('operation', 'scan')
    }

    if (
      this.state.get('operation') === 'scan' &&
      props.size
    ) {
      this.setAttribute('ExpressionAttributeNames', props)
      this.setAttribute('ExpressionAttributeValues', props)
      this.setExpression('FilterExpression', props)
    }

    return this.value()
  }

  async remove (...args) {
    const props = await this.prepare(...args)

    this.state.set('operation', 'deleteItem')
    return this.value()
  }

  use (plugin, name) {
    if (typeof plugin === 'function') {
      this.plugins.set(name || plugin.name, plugin)
    }

    return this
  }

  async value () {
    if (this.opts.dryRun) return this
    const params = this.params.toJSON()
    const operationType = this.state.get('operation')

    const operation = () =>
      this.client[operationType](params, { meta: this.opts.meta })
    
    if (this.plugins.size) {
      const results = []
      for (let [k, plugin] of this.plugins) {
        let result = plugin(params, operation.bind(this))
        results.push(result)
      }
      return results.length > 1 ? results : results[0]
    }

    return operation()
  }
}

module.exports = Db
