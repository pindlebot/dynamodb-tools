function _asyncToGenerator (fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step (key, arg) { try { var info = gen[key](arg); var value = info.value } catch (error) { reject(error); return } if (info.done) { resolve(value) } else { Promise.resolve(value).then(_next, _throw) } } function _next (value) { step('next', value) } function _throw (err) { step('throw', err) } _next() }) } }

const {
  EnhancedMap
} = require('serialize-map')

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
    path = toPath(path) // set params.TableName if {table}/{id} is provided

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

  setPartitionKeyAttributeName () {
    var _this = this

    return _asyncToGenerator(function * () {
      let tableName = _this.state.get('table')

      let table

      if (!_this.cache.has(tableName)) {
        table = yield _this.client.describeTable({
          TableName: tableName
        })
        table = EnhancedMap.create().fromJSON(table)

        _this.cache.set(tableName, table)
      } else {
        table = _this.cache.get(tableName)
      }

      let AttributeName = table.get('KeySchema').find(schema => schema.KeyType === 'HASH').AttributeName

      _this.state.set('name', AttributeName)

      return _this
    })()
  }

  prepare (...args) {
    var _this2 = this

    return _asyncToGenerator(function * () {
      // args[0]
      let path = args.find(arg => typeof arg === 'string') // args[0] or args[1]

      let props = args.find(arg => typeof arg === 'object') || {} // args [1] or args[2]

      let params = args[args.length - 1]
      params = typeof params === 'object' && !Object.is(params, props) ? params : {}
      _this2.params = EnhancedMap.create().fromJSON(params)
      _this2.props = EnhancedMap.create().fromJSON(props)

      if (path) {
        // set table name and key
        _this2.ref(path)
      }

      yield _this2.setPartitionKeyAttributeName()

      const name = _this2.state.get('name')

      const Key = [name]

      if (_this2.props.has(name)) {
        Key.push(_this2.props.get(name))

        _this2.props.delete(name)
      } else if (_this2.state.has('value')) {
        Key.push(_this2.state.get('value'))
      }

      if (Key.length === 2) {
        _this2.params.set('Key', EnhancedMap.create([Key]))
      }

      _this2.params.merge(_this2.state.has('table') ? {
        TableName: _this2.state.get('table')
      } : {})

      return _this2
    })()
  }

  reset () {
    this.state.clear()
    this.params.clear()
    return this
  }
}

module.exports = Base
