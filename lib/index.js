function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const client = require('../client')({
  region: process.env.AWS_REGION
});

const path = require('path');

const fs = require('fs-extra');

const expression = (data, opts = {
  separator: ' AND '
}) => {
  const expression = Object.keys(data).map(k => `#${k} = :${k}`).join(opts.separator);
  return opts.clause ? [opts.clause, expression].join(' ') : expression;
};

const attribute = (type, data) => {
  const char = type.endsWith('names') ? '#' : ':';
  return Object.keys(data).reduce((acc, key) => {
    acc[char + key] = char === ':' ? data[key] : key;
    return acc;
  }, {});
};

function db(table) {
  let data = {};
  let params = {
    TableName: table
  };
  let cache;
  let cachePromise = new Promise(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(function* (resolve, reject) {
      let tableData;
      let dir = path.join(__dirname, '../cache/');
      let cachePath = path.join(dir, `${table}.json`);

      try {
        tableData = require(cachePath);
      } catch (err) {
        tableData = yield client.describeTable({
          TableName: table
        });
        yield fs.ensureDir(dir);
        yield fs.writeJson(cachePath, tableData);
      }

      resolve(tableData);
    });

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }());

  const getAttributeName = () => {
    let {
      KeySchema
    } = cache;
    let {
      AttributeName
    } = KeySchema.find(({
      KeyType
    }) => KeyType === 'HASH');
    return AttributeName;
  };

  const key = pair => {
    let [name] = Object.keys(pair);

    if (name && typeof pair[name] !== 'undefined') {
      params.Key = pair;

      if (data[name]) {
        delete data[name];
      }
    }
  };

  const createParams =
  /*#__PURE__*/
  function () {
    var _ref2 = _asyncToGenerator(function* (...args) {
      cache = yield cachePromise;
      data = args.find(arg => typeof arg === 'object') || {};
      let name = getAttributeName();
      key({
        [name]: data[name] ? data[name] : args.find(arg => typeof arg === 'string')
      });
      return data;
    });

    return function createParams() {
      return _ref2.apply(this, arguments);
    };
  }();

  const getGlobalSecondaryIndex = (data = {}) => {
    const keys = Object.keys(data);
    if (!keys.length) return undefined;
    const {
      GlobalSecondaryIndexes
    } = cache;
    if (!GlobalSecondaryIndexes) return undefined;
    return GlobalSecondaryIndexes.find(({
      KeySchema
    }) => KeySchema.find(({
      AttributeName
    }) => keys.includes(AttributeName)));
  };

  const get =
  /*#__PURE__*/
  function () {
    var _ref3 = _asyncToGenerator(function* (...args) {
      let data = yield createParams(...args);
      console.log(data);
      const globalSecondaryIndex = getGlobalSecondaryIndex(data);
      let operation = typeof globalSecondaryIndex !== 'undefined' ? 'query' : params.Key ? 'get' : 'scan';

      if (operation !== 'get' && Object.keys(data).length) {
        params = _objectSpread({}, params, {
          ExpressionAttributeNames: attribute('names', data),
          ExpressionAttributeValues: attribute('values', data)
        });

        if (operation === 'query') {
          params.IndexName = globalSecondaryIndex.IndexName;
          params.KeyConditionExpression = expression(data);
        } else {
          params.FilterExpression = expression(data);
        }
      }

      return client[operation](params);
    });

    return function get() {
      return _ref3.apply(this, arguments);
    };
  }();

  const set =
  /*#__PURE__*/
  function () {
    var _ref4 = _asyncToGenerator(function* (...args) {
      let data = yield createParams(...args);

      if (Object.keys(data).length) {
        params.ExpressionAttributeNames = attribute('names', data);
        params.ExpressionAttributeValues = attribute('values', data);
        params.ReturnValues = 'ALL_NEW';
        params.UpdateExpression = expression(data, {
          separator: ', ',
          clause: 'SET'
        });
      }

      return client.updateItem(params);
    });

    return function set() {
      return _ref4.apply(this, arguments);
    };
  }();

  const remove =
  /*#__PURE__*/
  function () {
    var _ref5 = _asyncToGenerator(function* (...args) {
      yield createParams(...args);
      return client.deleteItem(params);
    });

    return function remove() {
      return _ref5.apply(this, arguments);
    };
  }();

  return {
    get,
    set,
    remove,
    key,
    params: _params => {
      params = _objectSpread({}, params, _params);
    }
  };
}

module.exports = db;