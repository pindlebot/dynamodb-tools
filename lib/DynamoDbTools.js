function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const Base = require('./Base');

const DynamoDbClient = require('./DynamoDbClient');

class DynamoDbTools extends Base {
  constructor(awsConfig = {
    region: 'us-east-1'
  }, options = {
    meta: false,
    prefix: '',
    dryRun: false,
    plugins: {}
  }) {
    super();
    this.AwsConfig = awsConfig;
    this.opts = options;
    this.opts.prefix = options.prefix || '';
    this.client = DynamoDbClient(this.AwsConfig);
    this.opts.plugins = options.plugins || {};
  }

  setAttribute(type, props) {
    const char = type === 'ExpressionAttributeNames' ? '#' : ':';
    const pairs = {};

    for (let key in props) {
      pairs[char + key] = char === ':' ? props[key] : key;
    }

    this.params[type] = pairs;
  }

  setExpression(key, props, opts = {
    separator: ' AND '
  }) {
    const expression = Object.keys(props).map(k => `#${k} = :${k}`).join(opts.separator);
    this.params[key] = opts.clause ? [opts.clause, expression].join(' ') : expression;
  }

  getGlobalSecondaryIndex(props) {
    if (!(props && Object.keys(props).length)) return undefined;
    const tableName = this.params.TableName;
    const table = this.cache[tableName];
    if (!table.GlobalSecondaryIndexes) return undefined;
    const globalSecondaryIndex = table.GlobalSecondaryIndexes.find(index => index.KeySchema.find(schema => Object.keys(props).includes(schema.AttributeName)));
    return globalSecondaryIndex;
  }

  set(...args) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const {
        props
      } = yield _this.prepare(...args);

      if (props && Object.keys(props).length) {
        _this.setAttribute('ExpressionAttributeNames', props);

        _this.setAttribute('ExpressionAttributeValues', props);

        _this.params.ReturnValues = 'ALL_NEW';

        _this.setExpression('UpdateExpression', props, {
          separator: ', ',
          clause: 'SET'
        });
      }

      _this.state.operation = 'updateItem';
      console.log(_this);
      return _this.value();
    })();
  }

  get(...args) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const {
        props
      } = yield _this2.prepare(...args);

      const globalSecondaryIndex = _this2.getGlobalSecondaryIndex(props);

      if (typeof globalSecondaryIndex !== 'undefined') {
        _this2.state.operation = 'query';
      } else if (_this2.params.Key) {
        _this2.state.operation = 'get';
      } else {
        _this2.state.operation = 'scan';
      }

      if (_this2.state.operation === 'scan' && props && Object.keys(props).length) {
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
      _this3.state.operation = 'deleteItem';
      return _this3.value();
    })();
  }

  use(plugin, name) {
    if (typeof plugin === 'function') {
      this.opts.plugins[name || plugin.name] = plugin;
    }

    return this;
  }

  value() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      if (_this4.opts.dryRun) return _this4;
      const params = _this4.params;
      const operationType = _this4.state.operation;

      const operation = () => _this4.client[operationType](params, {
        meta: _this4.opts.meta
      });

      const keys = Object.keys(_this4.opts.plugins || {});
      let results = [];

      while (keys.length) {
        let pluginName = keys.shift();
        let plugin = _this4.opts.plugins[pluginName];
        let result = yield plugin(params, operation.bind(_this4));
        results.push(result);
      }

      return results.length ? results : operation();
    })();
  }

}

function database(...args) {
  return new DynamoDbTools(...args);
}

database.database = database;

DynamoDbTools.prototype.database = function (...args) {
  if (!args.length) {
    args = [this.AwsConfig, this.opts];
  }

  return database.apply(DynamoDbTools, args);
};

DynamoDbTools.database = database;
module.exports = database;