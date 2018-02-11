'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Base = require('./Base');

var _require = require('serialize-map'),
    EnhancedMap = _require.EnhancedMap;

var DynamoDbClient = require('./DynamoDbClient');

var Db = function (_Base) {
  _inherits(Db, _Base);

  function Db() {
    var AwsConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      region: 'us-east-1'
    };
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Db);

    var _this = _possibleConstructorReturn(this, (Db.__proto__ || Object.getPrototypeOf(Db)).call(this));

    _this.plugins = new EnhancedMap();
    _this.client = DynamoDbClient(AwsConfig);
    _this.opts = {};
    _this.opts.meta = opts.meta || false;
    _this.opts.prefix = opts.prefix || '';
    return _this;
  }

  _createClass(Db, [{
    key: 'setAttribute',
    value: function setAttribute(type, props) {
      var char = type === 'ExpressionAttributeNames' ? '#' : ':';
      var pairs = {};
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = props[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var k = _ref2[0];
          var v = _ref2[1];

          pairs[char + k] = char === ':' ? v : k;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.params.set(type, pairs);
    }
  }, {
    key: 'setExpression',
    value: function setExpression(key, props) {
      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
        separator: ' AND '
      };

      var expression = [].concat(_toConsumableArray(props.keys())).map(function (k) {
        return `#${k} = :${k}`;
      }).join(opts.separator);

      this.params.set(key, opts.clause ? [opts.clause, expression].join(' ') : expression);
    }
  }, {
    key: 'getGlobalSecondaryIndex',
    value: function getGlobalSecondaryIndex(props) {
      if (!props.size) return undefined;
      var tableName = this.params.get('TableName');
      var table = this.cache.get(tableName).toJSON();
      if (!table.GlobalSecondaryIndexes) return undefined;

      var globalSecondaryIndex = table.GlobalSecondaryIndexes.find(function (index) {
        return index.KeySchema.find(function (schema) {
          return [].concat(_toConsumableArray(props.keys())).indexOf(schema.AttributeName) > -1;
        });
      });

      return globalSecondaryIndex;
    }
  }, {
    key: 'set',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _ref4,
            props,
            _args = arguments;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.prepare.apply(this, _args);

              case 2:
                _ref4 = _context.sent;
                props = _ref4.props;


                if (props.size) {
                  this.setAttribute('ExpressionAttributeNames', props);
                  this.setAttribute('ExpressionAttributeValues', props);
                  this.params.set('ReturnValues', 'ALL_NEW');
                  this.setExpression('UpdateExpression', props, { separator: ', ', clause: 'SET' });
                }

                this.state.set('operation', 'updateItem');
                return _context.abrupt('return', this.value());

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function set() {
        return _ref3.apply(this, arguments);
      }

      return set;
    }()
  }, {
    key: 'get',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _ref6,
            props,
            globalSecondaryIndex,
            _args2 = arguments;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.prepare.apply(this, _args2);

              case 2:
                _ref6 = _context2.sent;
                props = _ref6.props;
                globalSecondaryIndex = this.getGlobalSecondaryIndex(props);


                if (typeof globalSecondaryIndex !== 'undefined') {
                  this.state.set('operation', 'query');
                } else if (this.params.has('Key')) {
                  this.state.set('operation', 'get');
                } else {
                  this.state.set('operation', 'scan');
                }

                if (this.state.get('operation') === 'scan' && props.size) {
                  this.setAttribute('ExpressionAttributeNames', props);
                  this.setAttribute('ExpressionAttributeValues', props);
                  this.setExpression('FilterExpression', props);
                }

                return _context2.abrupt('return', this.value());

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function get() {
        return _ref5.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var props,
            _args3 = arguments;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.prepare.apply(this, _args3);

              case 2:
                props = _context3.sent;


                this.state.set('operation', 'deleteItem');
                return _context3.abrupt('return', this.value());

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function remove() {
        return _ref7.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: 'use',
    value: function use(plugin, name) {
      if (typeof plugin === 'function') {
        this.plugins.set(name || plugin.name, plugin);
      }

      return this;
    }
  }, {
    key: 'value',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        var _this2 = this;

        var params, operationType, operation, results, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _ref9, _ref10, k, plugin, result;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!this.opts.dryRun) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt('return', this);

              case 2:
                params = this.params.toJSON();
                operationType = this.state.get('operation');

                operation = function operation() {
                  return _this2.client[operationType](params, { meta: _this2.opts.meta });
                };

                if (!this.plugins.size) {
                  _context4.next = 27;
                  break;
                }

                results = [];
                _iteratorNormalCompletion2 = true;
                _didIteratorError2 = false;
                _iteratorError2 = undefined;
                _context4.prev = 10;

                for (_iterator2 = this.plugins[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  _ref9 = _step2.value;
                  _ref10 = _slicedToArray(_ref9, 2);
                  k = _ref10[0];
                  plugin = _ref10[1];
                  result = plugin(this, operation.bind(this));

                  results.push(result);
                }
                _context4.next = 18;
                break;

              case 14:
                _context4.prev = 14;
                _context4.t0 = _context4['catch'](10);
                _didIteratorError2 = true;
                _iteratorError2 = _context4.t0;

              case 18:
                _context4.prev = 18;
                _context4.prev = 19;

                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }

              case 21:
                _context4.prev = 21;

                if (!_didIteratorError2) {
                  _context4.next = 24;
                  break;
                }

                throw _iteratorError2;

              case 24:
                return _context4.finish(21);

              case 25:
                return _context4.finish(18);

              case 26:
                return _context4.abrupt('return', results.length > 1 ? results : results[0]);

              case 27:

                this.params.clear();
                this.state.clear();
                return _context4.abrupt('return', operation());

              case 30:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[10, 14, 18, 26], [19,, 21, 25]]);
      }));

      function value() {
        return _ref8.apply(this, arguments);
      }

      return value;
    }()
  }]);

  return Db;
}(Base);

module.exports = Db;