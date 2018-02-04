
const toPath = require('lodash.topath')
const Client = require('./DynamoDbClient')
const { List, Record } = require('./base')

class Base {
  constructor () {
    this.state = new Record()
    this.params = new Record()
    this.cache = new Record()
  }

  table (name) {
    this.state.set('table', this.opts.prefix + name)
    return this
  }

  ref (path) {
    // {table}/{id} or {id}
    path = toPath(path)

    // set params.TableName if {table}/{id} is provided
    if (path.length > 1) {
      this.table(path[0])
      this.state.set('value', path[1])
      return this
    }

    if (!this.state.has('table')) {
      this.table(path[0])
      return this
    }

    this.state.set('value', path[0])
    return this
  }

  async setPartitionKeyAttributeName () {
    let tableName = this.state.get('table')
    let table

    if (!this.cache.has(tableName)) {
      table = await this.client.describeTable({
        TableName: tableName
      })
      table = new Record().fromJSON(table)
      this.cache.set(tableName, table)
    } else {
      table = this.cache.get(tableName)
    }

    let AttributeName = table.get('KeySchema')
      .find(schema =>
        schema.KeyType === 'HASH'
      ).AttributeName

    this.state.set('name', AttributeName)

    return this
  }

  async prepare (...args) {
    args = new List(args)
    // args[0]
    let path = args.find(arg => typeof arg === 'string')
    // args[0] or args[1]
    let props = args.find(arg => typeof arg === 'object') || {}
    // args [1] or args[2]
    let params = args.last()
    params = typeof params === 'object' &&
      !Object.is(params, props)
      ? params : {}

    this.params = new Record().fromJSON(params)
    this.props = new Record().fromJSON(props)

    if (path) {
      // set table name and key
      this.ref(path)
    }

    await this.setPartitionKeyAttributeName()

    const name = this.state.get('name')
    const Key = [name]

    if (this.props.has(name)) {
      Key.push(this.props.get(name))
      this.props.delete(name)
    } else if (this.state.has('value')) {
      Key.push(this.state.get('value'))
    }

    if (Key.length === 2) {
      this.params.set('Key', new Record([Key]))
    }

    this.params.merge(
      this.state.has('table')
        ? { TableName: this.state.get('table') }
        : {}
    )

    return this
  }
}

class Db extends Base {
  constructor (
    AwsConfig = {
      region: 'us-east-1'
    },
    opts = {}
  ) {
    super()
    this.plugins = new Record()
    this.client = Client(AwsConfig)

    this.opts = {
      meta: false,
      prefix: '',
      ...opts
    }
  }

  setAttribute (type, props) {
    const char = type === 'ExpressionAttributeNames' ? '#' : ':'
    const pairs = {}
    for (let [k, v] of props) {
      pairs[char + k] = char === ':' ? v : k
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
    const table = this.params.get('TableName')
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
      Object.keys(props).length
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

  use (plugin) {
    if (typeof plugin === 'function') {
      this.plugins.set(plugin.name, plugin)
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
      for (let [k, plugin] of this.plugins) {
        plugin(this, operation.bind(this))
      }
      return
    }

    this.params.clear()
    this.state.clear()
    return operation()
  }
}

module.exports = Db
