(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "@ephox/katamari", "./CaretBookmark", "../caret/CaretContainer", "../caret/CaretPosition", "../dom/NodeType", "../selection/RangeNodes", "../text/Zwsp", "../util/Tools", "../selection/RangeInsertNode"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("@ephox/katamari"), require("./CaretBookmark"), require("../caret/CaretContainer"), require("../caret/CaretPosition"), require("../dom/NodeType"), require("../selection/RangeNodes"), require("../text/Zwsp"), require("../util/Tools"), require("../selection/RangeInsertNode"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.katamari, global.CaretBookmark, global.CaretContainer, global.CaretPosition, global.NodeType, global.RangeNodes, global.Zwsp, global.Tools, global.RangeInsertNode);
        global.GetBookmark = mod.exports;
    }
})(this, function (exports, _katamari, _CaretBookmark, _CaretContainer, _CaretPosition, _NodeType, _RangeNodes, _Zwsp, _Tools, _RangeInsertNode) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _CaretBookmark2 = _interopRequireDefault(_CaretBookmark);

    var _CaretContainer2 = _interopRequireDefault(_CaretContainer);

    var _CaretPosition2 = _interopRequireDefault(_CaretPosition);

    var _NodeType2 = _interopRequireDefault(_NodeType);

    var _RangeNodes2 = _interopRequireDefault(_RangeNodes);

    var _Zwsp2 = _interopRequireDefault(_Zwsp);

    var _Tools2 = _interopRequireDefault(_Tools);

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

    var GetBookmark = function () {
        function GetBookmark() {
            _classCallCheck(this, GetBookmark);
        }

        _createClass(GetBookmark, null, [{
            key: "getBookmark",
            value: function getBookmark(selection, type, normalized) {
                if (type === 2) {
                    return this.__getOffsetBookmark(_Zwsp2.default.trim, normalized, selection);
                } else if (type === 3) {
                    return this.__getCaretBookmark(selection);
                } else if (type) {
                    return this.__getRangeBookmark(selection);
                } else {
                    return this.getPersistentBookmark(selection, false);
                }
            }
        }, {
            key: "getUndoBookmark",
            value: function getUndoBookmark() {
                return _katamari.Fun.curry(this.__getOffsetBookmark, _katamari.Fun.identity, true);
            }
        }, {
            key: "getPersistentBookmark",
            value: function getPersistentBookmark(selection, filled) {
                var dom = selection.dom,
                    rng = selection.getRng(),
                    id = dom.uniqueId(),
                    element = selection.getNode();

                var name = element.nodeName;
                if (name === "IMG") {
                    return { name: name, index: this.__findIndex(dom, name, element) };
                }

                var rng2 = this.__normalizeTableCellSelection(rng.cloneRange());
                if (!selection.isCollapsed()) {
                    rng2.collapse(false);
                    (0, _RangeInsertNode.rangeInsertNode)(dom, rng2, this.__createBookmarkSpan(dom, id + "_end", filled));
                }

                rng = this.__normalizeTableCellSelection(rng);
                rng.collapse(true);
                (0, _RangeInsertNode.rangeInsertNode)(dom, rng, this.__createBookmarkSpan(dom, id + "_start", filled));
                selection.moveToBookmark({ id: id, keep: 1 });

                return { id: id };
            }
        }, {
            key: "__getNormalizedTextOffset",
            value: function __getNormalizedTextOffset(trim, container, offset) {
                var node = void 0,
                    trimmedOffset = void 0;

                trimmedOffset = trim(container.data.slice(0, offset)).length;
                for (node = container.previousSibling; node && _NodeType2.default.isText(node); node = node.previousSibling) {
                    trimmedOffset += trim(node.data).length;
                }
                return trimmedOffset;
            }
        }, {
            key: "__getPoint",
            value: function __getPoint(dom, trim, normalized, rng, start) {
                var container = rng[start ? "startContainer" : "endContainer"],
                    offset = rng[start ? "startOffset" : "endOffset"],
                    point = [];

                if (_NodeType2.default.isText(container)) {
                    point.push(normalized ? this.__getNormalizedTextOffset(trim, container, offset) : offset);
                } else {
                    var after = 0,
                        childNodes = container.childNodes;

                    if (offset >= childNodes.length && childNodes.length) {
                        after = 1;
                        offset = Math.max(0, childNodes.length - 1);
                    }
                    point.push(dom.nodeIndex(childNodes[offset], normalized) + after);
                }
                for (; container && container !== dom.getRoot(); container = container.parentNode) {
                    point.push(dom.nodeIndex(container, normalized));
                }

                return point;
            }
        }, {
            key: "__getLocation",
            value: function __getLocation(trim, selection, normalized, rng) {
                var dom = selection.dom,
                    bookmark = {};

                bookmark.start = this.__getPoint(dom, trim, normalized, rng, true);
                if (!selection.isCollapsed()) {
                    bookmark.end = this.__getPoint(dom, trim, normalized, rng, false);
                }
                return bookmark;
            }
        }, {
            key: "__findIndex",
            value: function __findIndex(dom, name, element) {
                var count = 0;

                _Tools2.default.each(dom.select(name), function (node) {
                    if (node.getAttribute("data-editor-bogus") === "all") {
                        return;
                    }
                    if (node === element) {
                        return false;
                    }
                    count++;
                });
                return count;
            }
        }, {
            key: "__moveEndPoint",
            value: function __moveEndPoint(rng, start) {
                var container = void 0,
                    offset = void 0,
                    childNodes = void 0,
                    prefix = start ? "start" : "end";

                container = rng[prefix + "Container"];
                offset = rng[prefix + "Offset"];

                if (_NodeType2.default.isElement(container) && container.nodeName === "TR") {
                    childNodes = container.childNodes;
                    container = childNodes[Math.min(start ? offset : offset - 1, childNodes.length - 1)];
                    if (container) {
                        offset = start ? 0 : container.childNodes.length;
                        rng["set" + (start ? "Start" : "End")](container, offset);
                    }
                }
            }
        }, {
            key: "__normalizeTableCellSelection",
            value: function __normalizeTableCellSelection(rng) {
                this.__moveEndPoint(rng, true);
                this.__moveEndPoint(rng, false);
                return rng;
            }
        }, {
            key: "__findSibling",
            value: function __findSibling(node, offset) {
                if (_NodeType2.default.isElement(node)) {
                    node = _RangeNodes2.default.getNode(node, offset);
                    if (_NodeType2.default.isContentEditableFalse(node)) {
                        return node;
                    }
                }

                if (_CaretContainer2.default.isCaretContainer(node)) {
                    if (_NodeType2.default.isText(node) && _CaretContainer2.default.isCaretContainerBlock(node)) {
                        node = node.parentNode;
                    }

                    var sibling = node.previousSibling;
                    if (_NodeType2.default.isContentEditableFalse(sibling)) {
                        return sibling;
                    }
                    sibling = node.nextSibling;
                    if (_NodeType2.default.isContentEditableFalse(sibling)) {
                        return sibling;
                    }
                }
            }
        }, {
            key: "__findAdjacentContentEditableFalseElm",
            value: function __findAdjacentContentEditableFalseElm(rng) {
                return this.__findSibling(rng.startContainer, rng.startOffset) || this.__findSibling(rng.endContainer, rng.endOffset);
            }
        }, {
            key: "__getOffsetBookmark",
            value: function __getOffsetBookmark(trim, normalized, selection) {
                var element = selection.getNode(),
                    name = element ? element.nodeName : null,
                    rng = selection.getRng();

                if (_NodeType2.default.isContentEditableFalse(element) || name === "IMG") {
                    return { name: name, index: this.__findIndex(selection.dom, name, element) };
                }

                var sibling = this.__findAdjacentContentEditableFalseElm(rng);
                if (sibling) {
                    name = sibling.tagName;
                    return { name: name, index: this.__findIndex(selection.dom, name, sibling) };
                }
                return this.__getLocation(trim, selection, normalized, rng);
            }
        }, {
            key: "__getCaretBookmark",
            value: function __getCaretBookmark(selection) {
                var rng = selection.getRng();

                return {
                    start: _CaretBookmark2.default.create(selection.dom.getRoot(), _CaretPosition2.default.fromRangeStart(rng)),
                    end: _CaretBookmark2.default.create(selection.dom.getRoot(), _CaretPosition2.default.fromRangeEnd(rng))
                };
            }
        }, {
            key: "__getRangeBookmark",
            value: function __getRangeBookmark(selection) {
                return { rng: selection.getRng() };
            }
        }, {
            key: "__createBookmarkSpan",
            value: function __createBookmarkSpan(dom, id, filled) {
                var args = { "data-editor-type": "bookmark", "id": id, "style": "overflow:hidden;line-height:0px" };
                return filled ? dom.create("span", args, "&#xFEFF;") : dom.create("span", args);
            }
        }]);

        return GetBookmark;
    }();

    exports.default = GetBookmark;
});
