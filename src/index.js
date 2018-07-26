const client = require('./client')({ region: process.env.AWS_REGION })

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

const value = (operation, params) => client[operation](params)
  .then(data => {
    if (
      operation === 'get' &&
      (typeof data === 'undefined' || !Object.keys(data).length)
    ) {
      return Promise.reject(new Error('unknown record'))
    }
    return data
  })

const cache = {}

function db (table) {
  let data = {}
  let params = {
    TableName: table
  }

  const cachePromise = new Promise(async (resolve, reject) => {
    if (!cache[table]) {
      cache[table] = await client.table({
        TableName: table
      })
    }
    resolve(cache[table])
  })

  const getAttributeName = () => {
    let { KeySchema } = cache[table]
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
    await cachePromise
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
    const { GlobalSecondaryIndexes } = cache[table]
    if (!GlobalSecondaryIndexes) return undefined

    return GlobalSecondaryIndexes.find(({ KeySchema }) =>
      KeySchema.find(({ AttributeName }) =>
        keys.includes(AttributeName)
      )
    )
  }

  const get = async (...args) => {
    let data = await createParams(...args)
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
      params.ExpressionAttributeNames = attribute('names', data)
      params.ExpressionAttributeValues = attribute('values', data)

      if (operation === 'query') {
        params.IndexName = globalSecondaryIndex.IndexName
        params.KeyConditionExpression = expression(data)
      } else {
        params.FilterExpression = expression(data)
      }
    }

    return value(operation, params)
  }

  const set = async (...args) => {
    let data = await createParams(...args)
    if (Object.keys(data).length) {
      params.ExpressionAttributeNames = attribute('names', data)
      params.ExpressionAttributeValues = attribute('values', data)
      params.ReturnValues = 'ALL_NEW'
      params.UpdateExpression = expression(data, { separator: ', ', clause: 'SET' })
    }
    return value('update', params)
  }

  const remove = async (...args) => {
    await createParams(...args)
    return value('remove', params)
  }

  return {
    get,
    set,
    remove,
    key,
    params: (_params) => {
      params = {
        ...params,
        ..._params
      }
    }
  }
}

module.exports = db
