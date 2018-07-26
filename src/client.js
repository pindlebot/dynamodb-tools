const { DynamoDB } = require('aws-sdk')

module.exports = function DynamoDbClient (
  config = { region: 'us-east-1' }
) {
  const documentClient = new DynamoDB.DocumentClient({
    region: config.region
  })

  const dynamoDb = new DynamoDB(config)

  function scan (params) {
    return documentClient.scan(params).promise() // Items
  }

  function get (params) {
    return documentClient.get(params).promise() // Item
  }

  function update (params) {
    return documentClient.update(params).promise() // Attributes
  }

  function remove (params) {
    return documentClient.delete(params).promise()
  }

  function query (params) {
    return documentClient.query(params).promise() // Items
  }

  function table (params) {
    return new Promise((resolve, reject) => {
      dynamoDb.describeTable(params, (err, data) => {
        if (err) reject(err)
        resolve(data.Table)
      })
    })
  }

  return {
    scan,
    get,
    update,
    remove,
    query,
    table
  }
}
