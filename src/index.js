const client = require('./client')({ region: process.env.AWS_REGION })
const path = require('path')
const fs = require('fs-extra')

const expression = (data, opts = { separator: ' AND ' }) => {
  const expression = Object.keys(data)
    .map(k => `#${k} = :${k}`)
    .join(opts.separator)

  return opts.clause
    ? [opts.clause, expression].join(' ')
    : expression
}

const attribute = (type, data) => {
  const char = type.endsWith('names') ? '#' : ':'
  return Object.keys(data).reduce((acc, key) => {
    acc[char + key] = char === ':' ? data[key] : key
    return acc
  }, {})
}

function db (table) {
  let data = {}
  let params = {}
  let cache
  let cachePromise
  
  const table = (tableName) => {
    params.TableName = tableName
    cachePromise = new Promise(async (resolve, reject) => {
      let tableData
      let dir = path.join(__dirname, '../cache/')
      let cachePath = path.join(dir, `${table}.json`)
      try {
        tableData = require(cachePath)
      } catch (err) {
        tableData = await client.describeTable({ TableName: table })
        await fs.ensureDir(dir)
        await fs.writeJson(cachePath, tableData)
      }
      resolve(tableData)
    })
  }

  const getAttributeName = () => {
    let { KeySchema } = cache
    let { AttributeName } = KeySchema.find(({ KeyType }) => KeyType === 'HASH')
    return AttributeName
  }

  const key = (pair) => {
    let [name] = Object.keys(pair)
    if (name && typeof pair[name] !== 'undefined') {
      params.Key = pair
      if (data[name]) {
        delete data[name]
      }
    }
  }

  const createParams = async (...args) => {
    cache = await cachePromise
    data = args.find(arg => typeof arg === 'object') || {}
    let name = getAttributeName()

    key({
      [name]: data[name]
        ? data[name]
        : args.find(arg => typeof arg === 'string')
    })

    return data
  }

  const getGlobalSecondaryIndex = (data = {}) => {
    const keys = Object.keys(data)
    if (!keys.length) return undefined
    const { GlobalSecondaryIndexes } = cache
    if (!GlobalSecondaryIndexes) return undefined

    return GlobalSecondaryIndexes.find(({ KeySchema }) =>
      KeySchema.find(({ AttributeName }) =>
        keys.includes(AttributeName)
      )
    )
  }

  const get = async (...args) => {
    let data = await createParams(...args)
    console.log(data)
    const globalSecondaryIndex = getGlobalSecondaryIndex(data)
    let operation = typeof globalSecondaryIndex !== 'undefined'
      ? 'query'
      : params.Key
        ? 'get'
        : 'scan'

    if (
      operation !== 'get' &&
      Object.keys(data).length
    ) {
      params = {
        ...params,
        ExpressionAttributeNames: attribute('names', data),
        ExpressionAttributeValues: attribute('values', data)
      }
      if (operation === 'query') {
        params.IndexName = globalSecondaryIndex.IndexName
        params.KeyConditionExpression = expression(data)
      } else {
        params.FilterExpression = expression(data)
      }
    }

    return client[operation](params)
  }

  const set = async (...args) => {
    let data = await createParams(...args)
    if (Object.keys(data).length) {
      params.ExpressionAttributeNames = attribute('names', data)
      params.ExpressionAttributeValues = attribute('values', data)
      params.ReturnValues = 'ALL_NEW'
      params.UpdateExpression = expression(data, { separator: ', ', clause: 'SET' })
    }
    return client.updateItem(params)
  }

  const remove = async (...args) => {
    await createParams(...args)
    return client.deleteItem(params)
  }

  const context = {
    get,
    set,
    remove,
    key,
    params: (_params) => {
      params = {
        ...params,
        ..._params
      }
    },
    table: () => {

    }
  }
  return context
}

module.exports = db
