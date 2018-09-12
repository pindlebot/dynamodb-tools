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
    let prop = `${char}${key}`
    if (char === ':') {
      if (Array.isArray(data[key])) {
        data[key].forEach((val, i) => {
          acc[`${prop}${i}`] = data[key][i]
        })
      } else {
        acc[prop] = data[key]
      }
    } else {
      acc[prop] = key
    }
    return acc
  }, {})
}

const value = (operation, params) => {
  if (process.env.DEBUG) {
    console.log(operation)
    console.log(params)
  }
  return client[operation](params)
}

const cache = {}

function db (table) {
  let data = {}
  let params = {
    TableName: table
  }
  let context = {}

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
        keys.includes(AttributeName) &&
          typeof data[AttributeName] !== 'undefined'
      )
    )
  }

  const get = async (...args) => {
    let data = await createParams(...args)
    const globalSecondaryIndex = getGlobalSecondaryIndex(data)
    let keys = Object.keys(data)
    let [name] = keys

    let operation = (typeof globalSecondaryIndex !== 'undefined' && keys.length)
      ? 'query'
      : params.Key
        ? 'get'
        : 'scan'

    if (keys.length === 1 && typeof data[name] === 'undefined') {
      return
    }

    // scan or query
    if (operation !== 'get' && keys.length) {
      params.ExpressionAttributeNames = attribute('names', data)
      params.ExpressionAttributeValues = attribute('values', data)

      if (operation === 'query') {
        let { AttributeName } = globalSecondaryIndex.KeySchema.find(({ KeyType }) => KeyType === 'HASH')
        params.IndexName = globalSecondaryIndex.IndexName
        params.KeyConditionExpression = expression({ [AttributeName]: data[AttributeName] })

        const FilterExpression = Object.keys(data)
          .filter(key => key !== AttributeName)
          .reduce((acc, key) => {
            if (Array.isArray(data[key])) {
              delete params.ExpressionAttributeValues[`:${key}`]
              data[key].forEach((val, i) => {
                acc.push(`contains(#${key}, :${key}${i})`)
              })
            } else {
              acc.push([`:${key} = #${key}`])
            }
            return acc
          }, [])

        if (FilterExpression.length) {
          params.FilterExpression = FilterExpression.join(', ')
        }
      } else {
        // scan
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
      .then(() => args.find(arg => typeof arg === 'object'))
  }

  context = {
    get,
    set,
    remove,
    key,
    params: _params => {
      params = {
        ...params,
        ..._params
      }
      return context
    }
  }

  return context
}

module.exports = db
