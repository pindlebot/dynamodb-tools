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
    this.params[type] = Object.keys(data).reduce((acc, key) => {
      acc[char + key] = char === ':' ? data[key] : key;
      return acc;
    }, {});
  }

  setExpression(key, data, opts = {
    separator: ' AND '
  }) {
    const expression = Object.keys(data).map(k => `#${k} = :${k}`).join(opts.separator);
    this.params[key] = opts.clause ? [opts.clause, expression].join(' ') : expression;
  }

  getGlobalSecondaryIndex(data = {}) {
    const keys = Object.keys(data);
    if (!keys.length) return undefined;
    const {
      GlobalSecondaryIndexes
    } = this.cache[this.params.TableName];
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

        _this.params.ReturnValues = 'ALL_NEW';

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
      const {
        data
      } = yield _this2.format(...args);

      const globalSecondaryIndex = _this2.getGlobalSecondaryIndex(data);

      let operation = typeof globalSecondaryIndex !== 'undefined' ? 'query' : _this2.params.Key ? 'get' : 'scan';

      if (operation === 'scan' && Object.keys(data).length) {
        _this2.setAttribute('ExpressionAttributeNames', data);

        _this2.setAttribute('ExpressionAttributeValues', data);

        _this2.setExpression('FilterExpression', data);
      }

      return _this2.value(operation);
    })();
  }

  remove(...args) {
    return this.format(...args).then(() => this.value('deleteItem'));
  }

  value(operation) {
    let TableName = this.params.TableName.slice(0);
    return this.client[operation](this.params).then(data => {
      Object.assign(this, database.apply(DynamoDbTools, this.AwsConfig));
      this.params.TableName = TableName;
      return data.length && data.length === 1 ? data[0] : data;
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