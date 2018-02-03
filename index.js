
const toPath = require('lodash.topath')
const Client = require('./DynamoDbClient')

class Record extends Map {
  toJSON () {
    return [...this.entries()]
      .filter(([k, v]) => v !== '' && typeof v !== 'undefined')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
  }

  fromJSON (props) {
    return new Record([...Object.entries(props)])
  }

  merge (props) {
    if (typeof props !== 'object') return this
    for (let [k, v] of Object.entries(props)) {
      this.set(k, v)
    }
    return this
  }
}

class List extends Set {
  find (...args) {
    return Array.from(this).find(...args)
  }

  last () {
    return Array.from(this)[this.size - 1]
  }

  get (index) {
    return Array.from(this)[index]
  }
}

class Base {
  constructor () {
    this.state = new Record()
    this.params = new Record()
    this.cache = new Record()
  }

  table (name) {
    name = this.opts.prefix + name.replace(this.opts.prefix, '')
    this.params.set('TableName', name)
    return this
  }

  setParams (props, params) {
    if (
      Object.keys(params).length
    ) {
      console.log('params', params)
      this.params.merge(params)
    }

    // get the primaryPartitionKey
    const key = this.state.get('key')
    // if the primaryPartitionKey value is provided in props
    // then pull it out and use it if state.value is undefined
    const { [key]: _, ...rest } = props
    const value = this.state.get('value') || _

      // set params.Key
    if (key && value) {
      this.params.set('Key', { [key]: value })
    }

    this.props = new Record().fromJSON(rest || {})
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

    if (!this.params.has('TableName')) {
      this.table(path[0])
      return this
    }

    this.state.set('value', path[0])

    return this
  }

  async setPrimaryPartitionKey () {
    let tableName = this.params.get('TableName')
    let table

    if (!this.cache.has(tableName)) {
      table = await this.client.describeTable({
        TableName: tableName
      })

      this.cache.set(tableName, table)
    } else {
      table = this.cache.get(tableName)
    }

    let primaryPartitionKey = table.KeySchema.find(schema =>
      schema.KeyType === 'HASH'
    ).AttributeName

    // set internal key
    this.state.set('key', primaryPartitionKey)
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

    if (path) {
      // set table name and internal value
      this.ref(path)
    }

    // set state.key
    await this.setPrimaryPartitionKey()

    // set params.Key and merge params
    this.setParams(props, params)
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

    let operation

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
