'use strict';

var _require = require('aws-sdk'),
    DynamoDB = _require.DynamoDB;

module.exports = function DynamoDbClient() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { region: 'us-east-1' };

  var documentClient = new DynamoDB.DocumentClient({
    region: config.region
  });

  var dynamoDb = new DynamoDB(config);

  function scan(params) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$meta = _ref.meta,
        meta = _ref$meta === undefined ? false : _ref$meta;

    return new Promise(function (resolve, reject) {
      return documentClient.scan(params).promise().then(function (data) {
        return resolve(meta ? data : data.Items);
      });
    });
  }

  function get(params) {
    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref2$meta = _ref2.meta,
        meta = _ref2$meta === undefined ? false : _ref2$meta;

    return new Promise(function (resolve, reject) {
      return documentClient.get(params).promise().then(function (data) {
        return resolve(meta ? data : data.Item);
      });
    });
  }

  function createItem(params) {
    var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref3$meta = _ref3.meta,
        meta = _ref3$meta === undefined ? false : _ref3$meta;

    return new Promise(function (resolve, reject) {
      return documentClient.put(params).promise().then(function () {
        return resolve(meta ? params : params.Item);
      });
    });
  }

  function updateItem(params) {
    var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref4$meta = _ref4.meta,
        meta = _ref4$meta === undefined ? false : _ref4$meta;

    return new Promise(function (resolve, reject) {
      return documentClient.update(params).promise().then(function (data) {
        return resolve(meta ? data : data.Attributes);
      });
    });
  }

  function deleteItem(params) {
    return new Promise(function (resolve, reject) {
      return documentClient.delete(params).promise().then(function (data) {
        return resolve(data);
      });
    });
  }

  function query(params) {
    var _ref5 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref5$meta = _ref5.meta,
        meta = _ref5$meta === undefined ? false : _ref5$meta;

    return new Promise(function (resolve, reject) {
      return documentClient.query(params).promise().then(function (data) {
        return resolve(meta ? data : data.Items);
      });
    });
  }

  function describeTable(params) {
    return new Promise(function (resolve, reject) {
      dynamoDb.describeTable(params, function (err, data) {
        resolve(data.Table);
      });
    });
  }

  return {
    scan,
    get,
    createItem,
    updateItem,
    deleteItem,
    query,
    describeTable,
    documentClient,
    dynamoDb
  };
};