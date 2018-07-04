const toPath = require('lodash.topath')

class Base {
  constructor () {
    // {
    //   table,
    //   value,
    //   name
    // }
    this.state = {}
    this.params = {}
    this.cache = {}
  }

  table (name) {
    this.state.table = this.opts.prefix + name
    return this
  }

  key (Key) {
    if (Object.keys(Key).length) {
      this.params.Key = Key
    }
    return this
  }

  ref (path) {
    // {table}/{id} or {id}
    path = toPath(path)

    // set params.TableName if {table}/{id} is provided
    if (path.length > 1) {
      this.table(path[0])
      this.state.value = path[1]
      return this
    }

    if (!this.state.hasOwnProperty('table')) {
      this.table(path[0])
      return this
    }

    this.state.value = path[0]
    return this
  }

  async setPartitionKeyAttributeName () {
    let tableName = this.state.table
    let table

    if (!this.cache.hasOwnProperty(tableName)) {
      table = await this.client.describeTable({
        TableName: tableName
      })
      this.cache[tableName] = table
    } else {
      table = this.cache[tableName]
    }

    let AttributeName = table.KeySchema
      .find(schema =>
        schema.KeyType === 'HASH'
      ).AttributeName

    this.state.name = AttributeName

    return this
  }

  async prepare (...args) {
    // args[0]
    let path = args.find(arg => typeof arg === 'string')
    // args[0] or args[1]
    let props = args.find(arg => typeof arg === 'object') || {}
    // args [1] or args[2]
    let params = args[args.length - 1]
    params = typeof params === 'object' &&
      !Object.is(params, props)
      ? params : {}

    this.params = params
    this.props = props

    if (path) {
      // set table name and key
      this.ref(path)
    }

    await this.setPartitionKeyAttributeName()

    const name = this.state.name
    const Key = {}

    if (this.props.hasOwnProperty(name)) {
      Key[name] = this.props[name]
      delete this.props[name]
    } else if (this.state.hasOwnProperty('value')) {
      Key[name] = this.state.value
    }

    this.key(Key)

    this.params = {
      ...this.params,
      ...(this.state.table
        ? { TableName: this.state.table }
        : {})
    }
    console.log(this)
    return this
  }

  reset () {
    this.state = {}
    this.params = {}
    return this
  }
}

module.exports = Base
