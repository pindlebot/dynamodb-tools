function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const Params = require('./Params');

const DynamoDbClient = require('./DynamoDbClient');

class DynamoDbTools extends Params {
  constructor(awsConfig = {
    region: 'us-east-1'
  }) {
    super();
    this.AwsConfig = awsConfig;
    this.client = DynamoDbClient(this.AwsConfig);
  }

  setAttribute(type, data) {
    const char = type.endsWith('Names') ? '#' : ':';
    this._params[type] = Object.keys(data).reduce((acc, key) => {
      acc[char + key] = char === ':' ? data[key] : key;
      return acc;
    }, {});
  }

  setExpression(key, data, opts = {
    separator: ' AND '
  }) {
    const expression = Object.keys(data).map(k => `#${k} = :${k}`).join(opts.separator);
    this._params[key] = opts.clause ? [opts.clause, expression].join(' ') : expression;
  }

  getGlobalSecondaryIndex(data = {}) {
    const keys = Object.keys(data);
    if (!keys.length) return undefined;
    const {
      GlobalSecondaryIndexes
    } = this.cache[this._params.TableName];
    if (!GlobalSecondaryIndexes) return undefined;
    return GlobalSecondaryIndexes.find(({
      KeySchema
    }) => KeySchema.find(({
      AttributeName
    }) => keys.includes(AttributeName)));
  }

  set(...args) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const {
        data
      } = yield _this.format(...args);

      if (Object.keys(data).length) {
        _this.setAttribute('ExpressionAttributeNames', data);

        _this.setAttribute('ExpressionAttributeValues', data);

        _this._params.ReturnValues = 'ALL_NEW';

        _this.setExpression('UpdateExpression', data, {
          separator: ', ',
          clause: 'SET'
        });
      }

      return _this.value('updateItem');
    })();
  }

  get(...args) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      yield _this2.format(...args);

      const globalSecondaryIndex = _this2.getGlobalSecondaryIndex(_this2.data);

      let operation = typeof globalSecondaryIndex !== 'undefined' ? 'query' : _this2._params.Key ? 'get' : 'scan';

      if (operation !== 'get' && Object.keys(_this2.data).length) {
        _this2.setAttribute('ExpressionAttributeNames', _this2.data);

        _this2.setAttribute('ExpressionAttributeValues', _this2.data);

        if (operation === 'query') {
          _this2._params.IndexName = globalSecondaryIndex.IndexName;

          _this2.setExpression('KeyConditionExpression', _this2.data);
        } else {
          _this2.setExpression('FilterExpression', _this2.data);
        }
      }

      return _this2.value(operation);
    })();
  }

  remove(...args) {
    return this.format(...args).then(() => this.value('deleteItem'));
  }

  value(operation) {
    let params = _objectSpread({}, this._params);

    Object.assign(this, database.apply(DynamoDbTools, this.AwsConfig)); // this._params = {
    //  TableName: params.TableName
    // }
    // this.data = {}

    return this.client[operation](params).then(data => {
      if (operation === 'get' && (typeof data === 'undefined' || !Object.keys(data).length)) {
        return Promise.reject(new Error('unknown record'));
      }

      return data;
    });
  }

}

function database(...args) {
  return new DynamoDbTools(...args);
}

database.database = database;

DynamoDbTools.prototype.database = function (...args) {
  return database.apply(DynamoDbTools, args);
};

DynamoDbTools.database = database;
module.exports = database;