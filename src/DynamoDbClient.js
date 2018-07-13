const { DynamoDB } = require('aws-sdk')

module.exports = function DynamoDbClient (
  config = { region: 'us-east-1' }
) {
  const documentClient = new DynamoDB.DocumentClient({
    region: config.region
  })

  const dynamoDb = new DynamoDB(config)

  function scan (params) {
    return documentClient.scan(params).promise()
      // .then(({ Items }) => Items)
  }

  function get (params) {
    return documentClient.get(params).promise()
     // .then(({ Item }) => Item)
  }

  function updateItem (params) {
    return documentClient.update(params).promise()
      // .then(({ Attributes }) => Attributes)
  }

  function deleteItem (params) {
    return documentClient.delete(params).promise()
  }

  function query (params) {
    documentClient.query(params).promise()
      // .then(({ Items }) => Items)
  }

  function describeTable (params) {
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
    updateItem,
    deleteItem,
    query,
    describeTable,
    documentClient,
    dynamoDb
  }
}
