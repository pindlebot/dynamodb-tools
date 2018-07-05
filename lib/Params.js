function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

class Params {
  constructor() {
    this.params = {};
    this.cache = {};
    this.data = {};
  }

  table(name) {
    if (name) {
      this.params.TableName = name;
    }

    return this;
  }

  ref(pair = {}) {
    let [name] = Object.keys(pair);

    if (name && typeof pair[name] !== 'undefined') {
      this.params.Key = pair;

      if (this.data[name]) {
        delete this.data[name];
      }
    }

    return this;
  }

  key(pair) {
    return this.ref(pair);
  }

  getAttributeName() {
    let {
      KeySchema
    } = this.cache[this.params.TableName];
    let {
      AttributeName
    } = KeySchema.find(({
      KeyType
    }) => KeyType === 'HASH');
    return AttributeName;
  }

  format(...args) {
    var _this = this;

    return _asyncToGenerator(function* () {
      _this.data = args.find(arg => typeof arg === 'object') || {};
      let {
        TableName
      } = _this.params;

      if (!TableName) {
        throw new Error(`TableName must be provided with chainable method table(tableName)`);
      }

      if (!_this.cache[TableName]) {
        _this.cache[TableName] = yield _this.client.describeTable({
          TableName
        });
      }

      let name = _this.getAttributeName();

      _this.key({
        [name]: _this.data[name] ? _this.data[name] : args.find(arg => typeof arg === 'string')
      });

      return _this;
    })();
  }

}

module.exports = Params;