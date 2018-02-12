const { EnhancedMap } = require('serialize-map')
const toPath = require('lodash.topath')

class Base {
  constructor () {
    this.state = EnhancedMap.create()
    this.params = EnhancedMap.create()
    this.cache = EnhancedMap.create()
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
      table = EnhancedMap.create().fromJSON(table)
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
    // args[0]
    let path = args.find(arg => typeof arg === 'string')
    // args[0] or args[1]
    let props = args.find(arg => typeof arg === 'object') || {}
    // args [1] or args[2]
    let params = args[args.length - 1]
    params = typeof params === 'object' &&
      !Object.is(params, props)
      ? params : {}

    this.params = EnhancedMap.create().fromJSON(params)
    this.props = EnhancedMap.create().fromJSON(props)

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
      this.params.set('Key', EnhancedMap.create([Key]))
    }

    this.params.merge(
      this.state.has('table')
        ? { TableName: this.state.get('table') }
        : {}
    )

    return this
  }

  reset () {
    this.state.clear()
    this.params.clear()
    return this
  }
}

module.exports = Base
