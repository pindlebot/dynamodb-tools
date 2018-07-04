const Base = require('./Base');

const DynamoDbTools = require('./DynamoDbTools');

const DynamoDbClient = require('./DynamoDbClient');

module.exports = DynamoDbTools;
module.exports.Db = DynamoDbTools;
module.exports.DynamoDbClient = DynamoDbClient;
module.exports.Base = Base;