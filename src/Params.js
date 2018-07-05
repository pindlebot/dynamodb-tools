class Params {
  constructor () {
    this.params = {}
    this.cache = {}
    this.data = {}
  }

  table (name) {
    if (name) {
      this.params.TableName = name
    }
    return this
  }

  ref (pair = {}) {
    let [name] = Object.keys(pair)
    if (name && typeof pair[name] !== 'undefined') {
      this.params.Key = pair
      if (this.data[name]) {
        delete this.data[name]
      }
    }
    return this
  }

  key (pair) {
    return this.ref(pair)
  }

  getAttributeName () {
    let { KeySchema } = this.cache[this.params.TableName]
    let { AttributeName } = KeySchema.find(({ KeyType }) => KeyType === 'HASH')
    return AttributeName
  }

  async format (...args) {
    this.data = args.find(arg => typeof arg === 'object') || {}

    let { TableName } = this.params
    if (!TableName) {
      throw new Error(`TableName must be provided with chainable method table(tableName)`)
    }

    if (!this.cache[TableName]) {
      this.cache[TableName] = await this.client.describeTable({ TableName })
    }

    let name = this.getAttributeName()

    this.key({
      [name]: this.data[name]
        ? this.data[name]
        : args.find(arg => typeof arg === 'string')
    })

    return this
  }
}

module.exports = Params
