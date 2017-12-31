import { DynamoDB } from 'aws-sdk'

const region : any = process.env.AWS_DYNAMODB_REGION || 'us-east-1'
const dynamoDb = new DynamoDB.DocumentClient({region})

export function scan(params) {
  return new Promise((resolve, reject) =>
    dynamoDb.scan(params).promise()
      .then(data => resolve(data.Items))
      .catch(err => reject(err)))
}

export function get(params) {
  return new Promise((resolve, reject) =>
    dynamoDb.get(params).promise()
      .then(data => resolve(data.Item))
      .catch(err => reject(err)))
}

export function createItem(params) {
  return new Promise((resolve, reject) =>
    dynamoDb.put(params).promise()
      .then(() => resolve(params.Item))
      .catch(err => reject(err)))
}

export function updateItem(params) {
  return new Promise((resolve, reject) =>
    dynamoDb.update(params).promise()
      .then(data => resolve(data.Attributes))
      .catch(err => reject(err)))
}

export function deleteItem(params) {
  return new Promise((resolve, reject) =>
    dynamoDb.delete(params).promise()
      .then(() => resolve(params))
      .catch(err => reject(err)))
}

export function query(params) {
  return new Promise((resolve, reject) =>
  dynamoDb.query(params).promise()
    .then(data => resolve(data.Items))
    .catch(err => reject(err)))
}

export function prependObjectKeys(obj, char, mapToValues = false) {
  return Object.keys(obj).reduce((acc, key) => {
    if(key !== '__typename' && obj[key] !== '') {
      acc[`${char}${key}`] = mapToValues ? obj[key] : key
    }
    return acc
  }, {})
}

export const mapAttributes = rest => ({
  ExpressionAttributeNames: {
    ...prependObjectKeys(rest, '#', false),
  },
  ExpressionAttributeValues: {
    ...prependObjectKeys(rest, ':', true),
  },
})

export const createExpression = rest => Object.keys(rest).map(key => `#${key} = :${key}`).join(', ')

export const createFilterExpression = (rest) => ({
  FilterExpression: createExpression(rest)
})

export const createResponse = resp => ({
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  statusCode: 200,
  body: JSON.stringify(resp),
})