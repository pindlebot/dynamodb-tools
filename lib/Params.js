function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Params {
  constructor() {
    this._params = {};
    this.cache = {};
    this.data = {};
  }

  params(_params = {}) {
    this._params = _objectSpread({}, this._params, _params);
    return this;
  }

  table(name) {
    if (name) {
      this._params.TableName = name;
    }

    return this;
  }

  ref(pair = {}) {
    let [name] = Object.keys(pair);

    if (name && typeof pair[name] !== 'undefined') {
      this._params.Key = pair;

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
    } = this.cache[this._params.TableName];
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
      } = _this._params;

      if (!TableName) {
        throw new Error(`TableName must be provided with chainable method table(tableName)`);
      }

      if (_this._params.Key) {
        return _this;
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