function _asyncToGenerator (fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step (key, arg) { try { var info = gen[key](arg); var value = info.value } catch (error) { reject(error); return } if (info.done) { resolve(value) } else { Promise.resolve(value).then(_next, _throw) } } function _next (value) { step('next', value) } function _throw (err) { step('throw', err) } _next() }) } }

const Base = require('./Base')

const {
  EnhancedMap,
  toJSON
} = require('serialize-map')

const DynamoDbClient = require('./DynamoDbClient')

const intersection = require('lodash.intersection')

const defaultConfig = {
  region: 'us-east-1'
}
const defaultOpts = {
  meta: false,
  prefix: '',
  dryRun: false
}

const isOpts = (config = {}) => !!intersection(Object.keys(config), ['meta', 'prefix', 'dryRun']).length

class Db extends Base {
  constructor (config = defaultConfig, opts = defaultOpts) {
    super()

    if (isOpts(config)) {
      opts = config
      config = defaultConfig
    }

    this.plugins = EnhancedMap.create()
    this.client = DynamoDbClient(config)
    this.opts = Object.assign({}, defaultOpts, opts)
  }

  static database (...args) {
    return new Db(...args)
  }

  setAttribute (type, props) {
    const char = type === 'ExpressionAttributeNames' ? '#' : ':'
    const pairs = {}

    for (let [k, v] of props) {
      pairs[char + k] = char === ':' ? v instanceof Map ? toJSON(v) : v : k
    }

    this.params.set(type, pairs)
  }

  setExpression (key, props, opts = {
    separator: ' AND '
  }) {
    const expression = [...props.keys()].map(k => `#${k} = :${k}`).join(opts.separator)
    this.params.set(key, opts.clause ? [opts.clause, expression].join(' ') : expression)
  }

  getGlobalSecondaryIndex (props) {
    if (!props.size) return undefined
    const tableName = this.params.get('TableName')
    const table = this.cache.get(tableName).toJSON()
    if (!table.GlobalSecondaryIndexes) return undefined
    let globalSecondaryIndex = table.GlobalSecondaryIndexes.find(index => index.KeySchema.find(schema => [...props.keys()].indexOf(schema.AttributeName) > -1))
    return globalSecondaryIndex
  }

  set (...args) {
    var _this = this

    return _asyncToGenerator(function * () {
      const {
        props
      } = yield _this.prepare(...args)

      if (props.size) {
        _this.setAttribute('ExpressionAttributeNames', props)

        _this.setAttribute('ExpressionAttributeValues', props)

        _this.params.set('ReturnValues', 'ALL_NEW')

        _this.setExpression('UpdateExpression', props, {
          separator: ', ',
          clause: 'SET'
        })
      }

      _this.state.set('operation', 'updateItem')

      return _this.value()
    })()
  }

  get (...args) {
    var _this2 = this

    return _asyncToGenerator(function * () {
      const {
        props
      } = yield _this2.prepare(...args)

      const globalSecondaryIndex = _this2.getGlobalSecondaryIndex(props)

      if (typeof globalSecondaryIndex !== 'undefined') {
        _this2.state.set('operation', 'query')
      } else if (_this2.params.has('Key')) {
        _this2.state.set('operation', 'get')
      } else {
        _this2.state.set('operation', 'scan')
      }

      if (_this2.state.get('operation') === 'scan' && props.size) {
        _this2.setAttribute('ExpressionAttributeNames', props)

        _this2.setAttribute('ExpressionAttributeValues', props)

        _this2.setExpression('FilterExpression', props)
      }

      return _this2.value()
    })()
  }

  remove (...args) {
    var _this3 = this

    return _asyncToGenerator(function * () {
      const props = yield _this3.prepare(...args)

      _this3.state.set('operation', 'deleteItem')

      return _this3.value()
    })()
  }

  use (plugin, name) {
    if (typeof plugin === 'function') {
      this.plugins.set(name || plugin.name, plugin)
    }

    return this
  }

  value () {
    var _this4 = this

    return _asyncToGenerator(function * () {
      if (_this4.opts.dryRun) return _this4

      const params = _this4.params.toJSON()

      const operationType = _this4.state.get('operation')

      const operation = () => _this4.client[operationType](params, {
        meta: _this4.opts.meta
      })

      if (_this4.plugins.size) {
        const results = []

        for (let [k, plugin] of _this4.plugins) {
          let result = plugin(params, operation.bind(_this4))
          results.push(result)
        }

        return results.length > 1 ? results : results[0]
      }

      return operation()
    })()
  }
}

module.exports = (...args) => Db.database(...args)