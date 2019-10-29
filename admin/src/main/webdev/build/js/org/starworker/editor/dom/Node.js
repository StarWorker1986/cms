(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "editor/dom/DomObject", "editor/dom/NodeType"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("editor/dom/DomObject"), require("editor/dom/NodeType"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.DomObject, global.NodeType);
        global.Node = mod.exports;
    }
})(this, function (exports, _DomObject2, _NodeType) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _DomObject3 = _interopRequireDefault(_DomObject2);

    var _NodeType2 = _interopRequireDefault(_NodeType);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    var Node = function (_DomObject) {
        _inherits(Node, _DomObject);

        function Node(nativeNode) {
            var _ret, _ret2, _ret3, _ret4, _ret5, _ret6;

            _classCallCheck(this, Node);

            var _this = _possibleConstructorReturn(this, (Node.__proto__ || Object.getPrototypeOf(Node)).call(this, nativeNode));

            if (nativeNode) {
                switch (nativeNode.nodeType) {
                    case _NodeType2.default.DOCUMENT:
                        return _ret = new Document(nativeNode), _possibleConstructorReturn(_this, _ret);
                    case _NodeType2.default.ELEMENT:
                        return _ret2 = new Element(nativeNode), _possibleConstructorReturn(_this, _ret2);
                    case _NodeType2.default.TEXT:
                        return _ret3 = new Text(nativeNode), _possibleConstructorReturn(_this, _ret3);
                    case _NodeType2.default.COMMENT:
                        return _ret4 = new Comment(nativeNode), _possibleConstructorReturn(_this, _ret4);
                    case _NodeType2.default.FRAGMENT:
                        return _ret5 = new Fragment(nativeNode), _possibleConstructorReturn(_this, _ret5);
                    default:
                        return _ret6 = new _DomObject3.default(nativeNode), _possibleConstructorReturn(_this, _ret6);
                }
            }
            return _this;
        }

        return Node;
    }(_DomObject3.default);

    exports.default = Node;
});
