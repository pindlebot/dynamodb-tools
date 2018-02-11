'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('serialize-map'),
    EnhancedMap = _require.EnhancedMap;

var toPath = require('lodash.topath');

var Base = function () {
  function Base() {
    _classCallCheck(this, Base);

    this.state = new EnhancedMap();
    this.params = new EnhancedMap();
    this.cache = new EnhancedMap();
  }

  _createClass(Base, [{
    key: 'table',
    value: function table(name) {
      this.state.set('table', this.opts.prefix + name);
      return this;
    }
  }, {
    key: 'ref',
    value: function ref(path) {
      // {table}/{id} or {id}
      path = toPath(path);

      // set params.TableName if {table}/{id} is provided
      if (path.length > 1) {
        this.table(path[0]);
        this.state.set('value', path[1]);
        return this;
      }

      if (!this.state.has('table')) {
        this.table(path[0]);
        return this;
      }

      this.state.set('value', path[0]);
      return this;
    }
  }, {
    key: 'setPartitionKeyAttributeName',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var tableName, table, AttributeName;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                tableName = this.state.get('table');
                table = void 0;

                if (this.cache.has(tableName)) {
                  _context.next = 10;
                  break;
                }

                _context.next = 5;
                return this.client.describeTable({
                  TableName: tableName
                });

              case 5:
                table = _context.sent;

                table = new EnhancedMap().fromJSON(table);
                this.cache.set(tableName, table);
                _context.next = 11;
                break;

              case 10:
                table = this.cache.get(tableName);

              case 11:
                AttributeName = table.get('KeySchema').find(function (schema) {
                  return schema.KeyType === 'HASH';
                }).AttributeName;


                this.state.set('name', AttributeName);

                return _context.abrupt('return', this);

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function setPartitionKeyAttributeName() {
        return _ref.apply(this, arguments);
      }

      return setPartitionKeyAttributeName;
    }()
  }, {
    key: 'prepare',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var path, props, params, name, Key;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // args[0]
                path = args.find(function (arg) {
                  return typeof arg === 'string';
                });
                // args[0] or args[1]

                props = args.find(function (arg) {
                  return typeof arg === 'object';
                }) || {};
                // args [1] or args[2]

                params = args[args.length - 1];

                params = typeof params === 'object' && !Object.is(params, props) ? params : {};

                this.params = new EnhancedMap().fromJSON(params);
                this.props = new EnhancedMap().fromJSON(props);

                if (path) {
                  // set table name and key
                  this.ref(path);
                }

                _context2.next = 9;
                return this.setPartitionKeyAttributeName();

              case 9:
                name = this.state.get('name');
                Key = [name];


                if (this.props.has(name)) {
                  Key.push(this.props.get(name));
                  this.props.delete(name);
                } else if (this.state.has('value')) {
                  Key.push(this.state.get('value'));
                }

                if (Key.length === 2) {
                  this.params.set('Key', new EnhancedMap([Key]));
                }

                this.params.merge(this.state.has('table') ? { TableName: this.state.get('table') } : {});

                return _context2.abrupt('return', this);

              case 15:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function prepare() {
        return _ref2.apply(this, arguments);
      }

      return prepare;
    }()
  }]);

  return Base;
}();

module.exports = Base;