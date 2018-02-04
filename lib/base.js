const toPath = require('lodash.topath')

const flip = (first, ...rest) => [...rest, first]

class Record extends Map {
  getIn (path) {
    return toPath(path).reduce((acc, val) =>
      acc.has(val) ? acc.get(val) : acc,
    this)
  }

  setIn (path, value) {
    path = toPath(path)
    const key = path.pop()
    const child = this.getIn(path)
    if (child instanceof Record) {
      child.set(key, value)
    }

    return this
  }

  toJSON () {
    return [...this.entries()]
      .filter(([k, v]) => v !== '' && typeof v !== 'undefined')
      .reduce((acc, [k, v]) => {
        if (v instanceof Record) {
          acc[k] = v.toJSON()
        } else if (v instanceof Set) {
          acc[k] = [...v]
        } else {
          acc[k] = v
        }
        return acc
      }, {})
  }

  fromJSON (props) {
    return new Record([
      ...Object.entries(props).map(([k, v]) => {
        if (v instanceof Record) {
          return [k, v.fromJSON()]
        }
        if (Array.isArray(v)) {
          return [k, new List(v)]
        }
        if (typeof v === 'object' && v.constructor === Object) {
          return [k, new Record().fromJSON(v)]
        }
        return [k, v]
      })
    ])
  }

  merge (props) {
    let entries
    if (
      typeof props === 'object' &&
      props.constructor === Object
    ) {
      entries = Object.entries(props)
    } else if (props instanceof Map) {
      entries = props
    } else {
      return this
    }

    for (let [k, v] of entries) {
      this.set(k, v)
    }
    return this
  }

  first () {
    const entry = this.size ? Array.from(this.entries())[0] : undefined
    return entry
  }
}

class List extends Set {
  find (props) {
    return Array.from(this).find(props)
  }

  last () {
    return Array.from(this)[this.size - 1]
  }

  get (index) {
    return Array.from(this)[index]
  }
}

module.exports = { List, Record }
