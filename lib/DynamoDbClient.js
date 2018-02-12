'use strict';

var _require = require('aws-sdk');

const DynamoDB = _require.DynamoDB;


module.exports = function DynamoDbClient(config = { region: 'us-east-1' }) {
  const documentClient = new DynamoDB.DocumentClient({
    region: config.region
  });

  const dynamoDb = new DynamoDB(config);

  function scan(params, { meta = false } = {}) {
    return new Promise((resolve, reject) => documentClient.scan(params).promise().then(data => resolve(meta ? data : data.Items)));
  }

  function get(params, { meta = false } = {}) {
    return new Promise((resolve, reject) => documentClient.get(params).promise().then(data => resolve(meta ? data : data.Item)));
  }

  function createItem(params, { meta = false } = {}) {
    return new Promise((resolve, reject) => documentClient.put(params).promise().then(() => resolve(meta ? params : params.Item)));
  }

  function updateItem(params, { meta = false } = {}) {
    return new Promise((resolve, reject) => documentClient.update(params).promise().then(data => resolve(meta ? data : data.Attributes)));
  }

  function deleteItem(params) {
    return new Promise((resolve, reject) => documentClient.delete(params).promise().then(data => resolve(data)));
  }

  function query(params, { meta = false } = {}) {
    return new Promise((resolve, reject) => documentClient.query(params).promise().then(data => resolve(meta ? data : data.Items)));
  }

  function describeTable(params) {
    return new Promise((resolve, reject) => {
      dynamoDb.describeTable(params, (err, data) => {
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