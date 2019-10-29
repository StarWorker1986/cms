(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "@ephox/katamari", "../api/Env", "./CaretBookmark", "../caret/CaretPosition", "../dom/NodeType", "../api/util/Tools", "../fmt/FormatContainer", "../text/Zwsp", "../caret/CaretFinder", "./BookmarkTypes"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("@ephox/katamari"), require("../api/Env"), require("./CaretBookmark"), require("../caret/CaretPosition"), require("../dom/NodeType"), require("../api/util/Tools"), require("../fmt/FormatContainer"), require("../text/Zwsp"), require("../caret/CaretFinder"), require("./BookmarkTypes"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.katamari, global.Env, global.CaretBookmark, global.CaretPosition, global.NodeType, global.Tools, global.FormatContainer, global.Zwsp, global.CaretFinder, global.BookmarkTypes);
        global.ResolveBookmark = mod.exports;
    }
})(this, function (exports, _katamari, _Env, _CaretBookmark, _CaretPosition, _NodeType, _Tools, _FormatContainer, _Zwsp, _CaretFinder, _BookmarkTypes) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _Env2 = _interopRequireDefault(_Env);

    var _CaretBookmark2 = _interopRequireDefault(_CaretBookmark);

    var _CaretPosition2 = _interopRequireDefault(_CaretPosition);

    var _NodeType2 = _interopRequireDefault(_NodeType);

    var _Tools2 = _interopRequireDefault(_Tools);

    var _Zwsp2 = _interopRequireDefault(_Zwsp);

    var _CaretFinder2 = _interopRequireDefault(_CaretFinder);

    var _BookmarkTypes2 = _interopRequireDefault(_BookmarkTypes);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function addBogus(dom, node) {
        if (dom.isBlock(node) && !node.innerHTML && !_Env2.default.ie) {
            node.innerHTML = '<br data-mce-bogus="1" />';
        }
        return node;
    }

    function resolveCaretPositionBookmark(dom, bookmark) {
        var rng = void 0,
            pos = void 0;

        rng = dom.createRng();
        pos = _CaretBookmark2.default.resolve(dom.getRoot(), bookmark.start);
        rng.setStart(pos.container(), pos.offset());

        pos = _CaretBookmark2.default.resolve(dom.getRoot(), bookmark.end);
        rng.setEnd(pos.container(), pos.offset());

        return rng;
    }

    function insertZwsp(node, rng) {
        var textNode = node.ownerDocument.createTextNode(_Zwsp2.default.ZWSP);

        node.appendChild(textNode);
        rng.setStart(textNode, 0);
        rng.setEnd(textNode, 0);
    }

    function isEmpty(node) {
        return node.hasChildNodes() === false;
    }

    function tryFindRangePosition(node, rng) {
        return _CaretFinder2.default.lastPositionIn(node).fold(function () {
            return false;
        }, function (pos) {
            rng.setStart(pos.container(), pos.offset());
            rng.setEnd(pos.container(), pos.offset());
            return true;
        });
    }

    function padEmptyCaretContainer(root, node, rng) {
        if (isEmpty(node) && (0, _FormatContainer.getParentCaretContainer)(root, node)) {
            insertZwsp(node, rng);
            return true;
        } else {
            return false;
        }
    }

    function setEndPoint(dom, start, bookmark, rng) {
        var point = bookmark[start ? "start" : "end"],
            i = void 0,
            node = void 0,
            offset = void 0,
            children = void 0,
            root = dom.getRoot();

        if (point) {
            offset = point[0];
            for (node = root, i = point.length - 1; i >= 1; i--) {
                children = node.childNodes;
                if (padEmptyCaretContainer(root, node, rng)) {
                    return true;
                }
                if (point[i] > children.length - 1) {
                    if (padEmptyCaretContainer(root, node, rng)) {
                        return true;
                    }
                    return tryFindRangePosition(node, rng);
                }
                node = children[point[i]];
            }

            if (node.nodeType === 3) {
                offset = Math.min(point[0], node.nodeValue.length);
            }

            if (node.nodeType === 1) {
                offset = Math.min(point[0], node.childNodes.length);
            }

            if (start) {
                rng.setStart(node, offset);
            } else {
                rng.setEnd(node, offset);
            }
        }

        return true;
    }

    function isValidTextNode(node) {
        return _NodeType2.default.isText(node) && node.data.length > 0;
    }

    function restoreEndPoint(dom, suffix, bookmark) {
        var marker = dom.get(bookmark.id + '_' + suffix),
            node = void 0,
            idx = void 0,
            next = void 0,
            prev = void 0,
            keep = bookmark.keep,
            container = void 0,
            offset = void 0;

        if (marker) {
            node = marker.parentNode;
            if (suffix === "start") {
                if (!keep) {
                    idx = dom.nodeIndex(marker);
                } else {
                    if (marker.hasChildNodes()) {
                        node = marker.firstChild;
                        idx = 1;
                    } else if (isValidTextNode(marker.nextSibling)) {
                        node = marker.nextSibling;
                        idx = 0;
                    } else if (isValidTextNode(marker.previousSibling)) {
                        node = marker.previousSibling;
                        idx = marker.previousSibling.data.length;
                    } else {
                        node = marker.parentNode;
                        idx = dom.nodeIndex(marker) + 1;
                    }
                }
                container = node;
                offset = idx;
            } else {
                if (!keep) {
                    idx = dom.nodeIndex(marker);
                } else {
                    if (marker.hasChildNodes()) {
                        node = marker.firstChild;
                        idx = 1;
                    } else if (isValidTextNode(marker.previousSibling)) {
                        node = marker.previousSibling;
                        idx = marker.previousSibling.data.length;
                    } else {
                        node = marker.parentNode;
                        idx = dom.nodeIndex(marker);
                    }
                }
                container = node;
                offset = idx;
            }

            if (!keep) {
                prev = marker.previousSibling;
                next = marker.nextSibling;

                _Tools2.default.each(_Tools2.default.grep(marker.childNodes), function (node) {
                    if (_NodeType2.default.isText(node)) {
                        node.nodeValue = node.nodeValue.replace(/\uFEFF/g, '');
                    }
                });

                while (marker = dom.get(bookmark.id + '_' + suffix)) {
                    dom.remove(marker, true);
                }

                if (prev && next && prev.nodeType === next.nodeType && _NodeType2.default.isText(prev) && !_Env2.default.opera) {
                    idx = prev.nodeValue.length;
                    prev.appendData(next.nodeValue);
                    dom.remove(next);
                    if (suffix === "start") {
                        container = prev;
                        offset = idx;
                    } else {
                        container = prev;
                        offset = idx;
                    }
                }
            }
            return _katamari.Option.some((0, _CaretPosition2.default)(container, offset));
        } else {
            return _katamari.Option.none();
        }
    }

    function alt(o1, o2) {
        return o1.isSome() ? o1 : o2;
    }

    function resolvePaths(dom, bookmark) {
        var rng = dom.createRng();

        if (setEndPoint(dom, true, bookmark, rng) && setEndPoint(dom, false, bookmark, rng)) {
            return _katamari.Option.some(rng);
        } else {
            return _katamari.Option.none();
        }
    }

    function resolveId(dom, bookmark) {
        var startPos = restoreEndPoint(dom, "start", bookmark),
            endPos = restoreEndPoint(dom, "end", bookmark);

        return _katamari.Options.liftN([startPos, alt(endPos, startPos)], function (spos, epos) {
            var rng = dom.createRng();
            rng.setStart(addBogus(dom, spos.container()), spos.offset());
            rng.setEnd(addBogus(dom, epos.container()), epos.offset());
            return rng;
        });
    }

    function resolveIndex(dom, bookmark) {
        return _katamari.Option.from(dom.select(bookmark.name)[bookmark.index]).map(function (elm) {
            return dom.createRng().selectNode(elm);
        });
    }

    function resolve(selection, bookmark) {
        var dom = selection.dom;

        if (bookmark) {
            if (_BookmarkTypes2.default.isPathBookmark(bookmark)) {
                return resolvePaths(dom, bookmark);
            } else if (_BookmarkTypes2.default.isStringPathBookmark(bookmark)) {
                return _katamari.Option.some(resolveCaretPositionBookmark(dom, bookmark));
            } else if (_BookmarkTypes2.default.isIdBookmark(bookmark)) {
                return resolveId(dom, bookmark);
            } else if (_BookmarkTypes2.default.isIndexBookmark(bookmark)) {
                return resolveIndex(dom, bookmark);
            } else if (_BookmarkTypes2.default.isRangeBookmark(bookmark)) {
                return _katamari.Option.some(bookmark.rng);
            }
        }
        return _katamari.Option.none();
    }

    exports.default = {
        resolve: resolve
    };
});
