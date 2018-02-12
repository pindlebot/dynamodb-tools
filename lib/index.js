const Base = require('./Base')

const Db = require('./Db')

const DynamoDbClient = require('./DynamoDbClient')

const _exports = module.exports = Db

_exports.Db = Db
_exports.DynamoDbClient = DynamoDbClient
_exports.Base = Base
