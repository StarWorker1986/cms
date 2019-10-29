(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "../dom/NodeType", "../util/ArrUtils", "../util/DomUtils", "../util/Tools", "../caret/CaretPosition"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("../dom/NodeType"), require("../util/ArrUtils"), require("../util/DomUtils"), require("../util/Tools"), require("../caret/CaretPosition"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.NodeType, global.ArrUtils, global.DomUtils, global.Tools, global.CaretPosition);
        global.CaretBookmark = mod.exports;
    }
})(this, function (exports, _NodeType, _ArrUtils, _DomUtils, _Tools, _CaretPosition) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _NodeType2 = _interopRequireDefault(_NodeType);

    var _ArrUtils2 = _interopRequireDefault(_ArrUtils);

    var _DomUtils2 = _interopRequireDefault(_DomUtils);

    var _Tools2 = _interopRequireDefault(_Tools);

    var _CaretPosition2 = _interopRequireDefault(_CaretPosition);

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

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var CaretBookmark = function () {
        function CaretBookmark() {
            _classCallCheck(this, CaretBookmark);
        }

        _createClass(CaretBookmark, null, [{
            key: "create",
            value: function create(root, caretPosition) {
                var _this = this;

                var container = void 0,
                    offset = void 0,
                    path = [],
                    outputOffset = void 0,
                    childNodes = void 0,
                    parents = void 0;

                container = caretPosition.container();
                offset = caretPosition.offset();
                if (_NodeType2.default.isText(container)) {
                    outputOffset = this.__normalizedTextOffset(container, offset);
                } else {
                    childNodes = container.childNodes;
                    if (offset >= childNodes.length) {
                        outputOffset = "after";
                        offset = childNodes.length - 1;
                    } else {
                        outputOffset = "before";
                    }
                    container = childNodes[offset];
                }

                path.push(this.__createPathItem(container));
                parents = this.__parentsUntil(root, container);
                parents = _ArrUtils2.default.filter(parents, _Tools2.default.not(_NodeType2.default.isBogus));
                path = path.concat(_ArrUtils2.default.map(parents, function (node) {
                    return _this.__createPathItem(node);
                }));

                return path.reverse().join('/') + ',' + outputOffset;
            }
        }, {
            key: "resolve",
            value: function resolve(root, path) {
                var _this2 = this;

                var parts = void 0,
                    container = void 0,
                    offset = void 0;
                if (!path) {
                    return null;
                }

                parts = path.split(',');
                path = parts[0].split('/');
                offset = parts.length > 1 ? parts[1] : "before";
                container = _ArrUtils2.default.reduce(path, function (result, value) {
                    value = /([\w\-\(\)]+)\[([0-9]+)\]/.exec(value);
                    if (!value) {
                        return null;
                    }
                    if (value[1] === "text()") {
                        value[1] = "#text";
                    }
                    return _this2.__resolvePathItem(result, value[1], parseInt(value[2]));
                }, root);

                if (!container) {
                    return null;
                }

                if (!_NodeType2.default.isText(container)) {
                    if (offset === "after") {
                        offset = _DomUtils2.default.nodeIndex(container) + 1;
                    } else {
                        offset = _DomUtils2.default.nodeIndex(container);
                    }
                    return new _CaretPosition2.default(container.parentNode, offset);
                }

                return this.__findTextPosition(container, parseInt(offset));
            }
        }, {
            key: "__normalizedParent",
            value: function __normalizedParent(node) {
                var parentNode = node.parentNode;
                if (_NodeType2.default.isBogus(parentNode)) {
                    return this.__normalizedParent(parentNode);
                }
                return parentNode;
            }
        }, {
            key: "__getChildNodes",
            value: function __getChildNodes(node) {
                var _this3 = this;

                if (!node) {
                    return [];
                }

                return _ArrUtils2.default.reduce(node.childNodes, function (result, node) {
                    if (_NodeType2.default.isBogus(node) && node.nodeName !== "BR") {
                        result = result.concat(_this3.__getChildNodes(node));
                    } else {
                        result.push(node);
                    }
                    return result;
                }, []);
            }
        }, {
            key: "__normalizedTextOffset",
            value: function __normalizedTextOffset(node, offset) {
                while (node = node.previousSibling) {
                    if (!_NodeType2.default.isText(node)) {
                        break;
                    }
                    offset += node.data.length;
                }
                return offset;
            }
        }, {
            key: "__equals",
            value: function __equals(a) {
                return function (b) {
                    return a === b;
                };
            }
        }, {
            key: "__normalizedNodeIndex",
            value: function __normalizedNodeIndex(node) {
                var nodes = void 0,
                    index = void 0,
                    numTextFragments = void 0;

                nodes = this.__getChildNodes(this.__normalizedParent(node));
                index = _ArrUtils2.default.findIndex(nodes, this.__equals(node), node);
                nodes = nodes.slice(0, index + 1);
                numTextFragments = _ArrUtils2.default.reduce(nodes, function (result, node, i) {
                    if (_NodeType2.default.isText(node) && _NodeType2.default.isText(nodes[i - 1])) {
                        result++;
                    }
                    return result;
                }, 0);
                nodes = _ArrUtils2.default.filter(nodes, _NodeType2.default.matchNodeNames(node.nodeName));
                index = _ArrUtils2.default.findIndex(nodes, this.__equal(node), node);
                return index - numTextFragments;
            }
        }, {
            key: "__createPathItem",
            value: function __createPathItem(node) {
                var name = void 0;

                if (_NodeType2.default.isText(node)) {
                    name = "text()";
                } else {
                    name = node.nodeName.toLowerCase();
                }
                return name + "[" + this.__normalizedNodeIndex(node) + "]";
            }
        }, {
            key: "__parentsUntil",
            value: function __parentsUntil(root, node, predicate) {
                var parents = [];

                for (node = node.parentNode; node !== root; node = node.parentNode) {
                    if (predicate && predicate(node)) {
                        break;
                    }
                    parents.push(node);
                }
                return parents;
            }
        }, {
            key: "__resolvePathItem",
            value: function __resolvePathItem(node, name, index) {
                var nodes = this.__getChildNodes(node);

                nodes = _ArrUtils2.default.filter(nodes, function (node, index) {
                    return !_NodeType2.default.isText(node) || !_NodeType2.default.isText(nodes[index - 1]);
                });
                nodes = _ArrUtils2.default.filter(nodes, _NodeType2.default.matchNodeNames(name));
                return nodes[index];
            }
        }, {
            key: "__findTextPosition",
            value: function __findTextPosition(container, offset) {
                var node = container,
                    targetOffset = 0,
                    dataLen = void 0;

                while (_NodeType2.default.isText(node)) {
                    dataLen = node.data.length;
                    if (offset >= targetOffset && offset <= targetOffset + dataLen) {
                        container = node;
                        offset = offset - targetOffset;
                        break;
                    }
                    if (!_NodeType2.default.isText(node.nextSibling)) {
                        container = node;
                        offset = dataLen;
                        break;
                    }
                    targetOffset += dataLen;
                    node = node.nextSibling;
                }
                if (_NodeType2.default.isText(container) && offset > container.data.length) {
                    offset = container.data.length;
                }
                return new _CaretPosition2.default(container, offset);
            }
        }]);

        return CaretBookmark;
    }();

    exports.default = CaretBookmark;
});
