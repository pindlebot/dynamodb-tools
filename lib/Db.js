'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const Base = require('./Base');

var _require = require('serialize-map');

const EnhancedMap = _require.EnhancedMap;

const DynamoDbClient = require('./DynamoDbClient');

class Db extends Base {
  constructor(AwsConfig = {
    region: 'us-east-1'
  }, opts = {}) {
    super();
    this.plugins = new EnhancedMap();
    this.client = DynamoDbClient(AwsConfig);
    this.opts = {};
    this.opts.meta = opts.meta || false;
    this.opts.prefix = opts.prefix || '';
  }

  setAttribute(type, props) {
    const char = type === 'ExpressionAttributeNames' ? '#' : ':';
    const pairs = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = props[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let _ref = _step.value;

        var _ref2 = _slicedToArray(_ref, 2);

        let k = _ref2[0];
        let v = _ref2[1];

        pairs[char + k] = char === ':' ? v : k;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    this.params.set(type, pairs);
  }

  setExpression(key, props, opts = {
    separator: ' AND '
  }) {
    const expression = [...props.keys()].map(k => `#${k} = :${k}`).join(opts.separator);

    this.params.set(key, opts.clause ? [opts.clause, expression].join(' ') : expression);
  }

  getGlobalSecondaryIndex(props) {
    if (!props.size) return undefined;
    const tableName = this.params.get('TableName');
    const table = this.cache.get(tableName).toJSON();
    if (!table.GlobalSecondaryIndexes) return undefined;

    let globalSecondaryIndex = table.GlobalSecondaryIndexes.find(index => index.KeySchema.find(schema => [...props.keys()].indexOf(schema.AttributeName) > -1));

    return globalSecondaryIndex;
  }

  set(...args) {
    var _this = this;

    return _asyncToGenerator(function* () {
      var _ref3 = yield _this.prepare(...args);

      const props = _ref3.props;


      if (props.size) {
        _this.setAttribute('ExpressionAttributeNames', props);
        _this.setAttribute('ExpressionAttributeValues', props);
        _this.params.set('ReturnValues', 'ALL_NEW');
        _this.setExpression('UpdateExpression', props, { separator: ', ', clause: 'SET' });
      }

      _this.state.set('operation', 'updateItem');
      return _this.value();
    })();
  }

  get(...args) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      var _ref4 = yield _this2.prepare(...args);

      const props = _ref4.props;

      const globalSecondaryIndex = _this2.getGlobalSecondaryIndex(props);

      if (typeof globalSecondaryIndex !== 'undefined') {
        _this2.state.set('operation', 'query');
      } else if (_this2.params.has('Key')) {
        _this2.state.set('operation', 'get');
      } else {
        _this2.state.set('operation', 'scan');
      }

      if (_this2.state.get('operation') === 'scan' && props.size) {
        _this2.setAttribute('ExpressionAttributeNames', props);
        _this2.setAttribute('ExpressionAttributeValues', props);
        _this2.setExpression('FilterExpression', props);
      }

      return _this2.value();
    })();
  }

  remove(...args) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const props = yield _this3.prepare(...args);

      _this3.state.set('operation', 'deleteItem');
      return _this3.value();
    })();
  }

  use(plugin, name) {
    if (typeof plugin === 'function') {
      this.plugins.set(name || plugin.name, plugin);
    }

    return this;
  }

  value() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      if (_this4.opts.dryRun) return _this4;
      const params = _this4.params.toJSON();
      const operationType = _this4.state.get('operation');

      const operation = function operation() {
        return _this4.client[operationType](params, { meta: _this4.opts.meta });
      };

      _this4.params.clear();
      _this4.state.clear();

      if (_this4.plugins.size) {
        const results = [];
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = _this4.plugins[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            let _ref5 = _step2.value;

            var _ref6 = _slicedToArray(_ref5, 2);

            let k = _ref6[0];
            let plugin = _ref6[1];

            let result = plugin(params, operation.bind(_this4));
            results.push(result);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        return results.length > 1 ? results : results[0];
      }

      return operation();
    })();
  }
}

module.exports = Db;