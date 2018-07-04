function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const toPath = require('lodash.topath');

class Base {
  constructor() {
    // {
    //   table,
    //   value,
    //   name
    // }
    this.state = {};
    this.params = {};
    this.cache = {};
  }

  table(name) {
    this.state.table = this.opts.prefix + name;
    return this;
  }

  key(Key) {
    if (Object.keys(Key).length) {
      this.params.Key = Key;
    }

    return this;
  }

  ref(path) {
    // {table}/{id} or {id}
    path = toPath(path); // set params.TableName if {table}/{id} is provided

    if (path.length > 1) {
      this.table(path[0]);
      this.state.value = path[1];
      return this;
    }

    if (!this.state.hasOwnProperty('table')) {
      this.table(path[0]);
      return this;
    }

    this.state.value = path[0];
    return this;
  }

  setPartitionKeyAttributeName() {
    var _this = this;

    return _asyncToGenerator(function* () {
      let tableName = _this.state.table;
      let table;

      if (!_this.cache.hasOwnProperty(tableName)) {
        table = yield _this.client.describeTable({
          TableName: tableName
        });
        _this.cache[tableName] = table;
      } else {
        table = _this.cache[tableName];
      }

      let AttributeName = table.KeySchema.find(schema => schema.KeyType === 'HASH').AttributeName;
      _this.state.name = AttributeName;
      return _this;
    })();
  }

  prepare(...args) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      // args[0]
      let path = args.find(arg => typeof arg === 'string'); // args[0] or args[1]

      let props = args.find(arg => typeof arg === 'object') || {}; // args [1] or args[2]

      let params = args[args.length - 1];
      params = typeof params === 'object' && !Object.is(params, props) ? params : {};
      _this2.params = params;
      _this2.props = props;

      if (path) {
        // set table name and key
        _this2.ref(path);
      }

      yield _this2.setPartitionKeyAttributeName();
      const name = _this2.state.name;
      const Key = {};

      if (_this2.props.hasOwnProperty(name)) {
        Key[name] = _this2.props[name];
        delete _this2.props[name];
      } else if (_this2.state.hasOwnProperty('value')) {
        Key[name] = _this2.state.value;
      }

      _this2.key(Key);

      _this2.params = _objectSpread({}, _this2.params, _this2.state.table ? {
        TableName: _this2.state.table
      } : {});
      console.log(_this2);
      return _this2;
    })();
  }

  reset() {
    this.state = {};
    this.params = {};
    return this;
  }

}

module.exports = Base;