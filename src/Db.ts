import {
  scan,
  get,
  createItem,
  updateItem,
  deleteItem,
  query,
  prependObjectKeys,
  mapAttributes,
  createExpression,
  createFilterExpression,
  createResponse
} from './helpers'

export default function Db(params = {}) {
  Object.assign(this, { params })
}

Db.prototype.ref = function(params) {
  Db.apply(this, params)
  return this;
}

Db.prototype.getById = function(params) {
  return get(params)
}

Db.prototype.create = function({item, table = null}) {
  const params = {
    Item: item,
    ...this.params
  }

  if(table) params.TableName = table;

  return createItem(params)
}

Db.prototype.deleteById = function({key = null, table = null}) {
  const params = {
    ...this.params
  }
  
  if(key) params.Key = key;
  if(table) params.TableName = table;

  return deleteItem(params)
}

Db.prototype.update = function({item, key = null, table = null}) {
  const exp = Object.keys(item).map(k => `#${k} = :${k}`).join(', ')
  
  const params = {
    ...mapAttributes(item),
    UpdateExpression: `SET ${exp}`,
    ReturnValues: 'ALL_NEW',
    ...this.params
  }

  if(table) params.TableName = table;
  if(key) params.Key = key;
  
  return updateItem(params)
}

Db.prototype.filter = function({item, table = null}) {
  const params = {
    ...mapAttributes(item),
    ...createFilterExpression(item),
    ...this.params
  }

  if(table) params.TableName = table;

  return scan(params)
}


