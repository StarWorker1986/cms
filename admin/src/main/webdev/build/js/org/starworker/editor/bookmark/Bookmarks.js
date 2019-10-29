(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "./GetBookmark", "./ResolveBookmark", "../dom/NodeType"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("./GetBookmark"), require("./ResolveBookmark"), require("../dom/NodeType"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.GetBookmark, global.ResolveBookmark, global.NodeType);
        global.Bookmarks = mod.exports;
    }
})(this, function (exports, _GetBookmark, _ResolveBookmark, _NodeType) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _GetBookmark2 = _interopRequireDefault(_GetBookmark);

    var _ResolveBookmark2 = _interopRequireDefault(_ResolveBookmark);

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

    var Bookmarks = function () {
        function Bookmarks() {
            _classCallCheck(this, Bookmarks);
        }

        _createClass(Bookmarks, null, [{
            key: "getBookmark",
            value: function getBookmark(selection, type, normalized) {
                return _GetBookmark2.default.getBookmark(selection, type, normalized);
            }
        }, {
            key: "moveToBookmark",
            value: function moveToBookmark(selection, bookmark) {
                _ResolveBookmark2.default.resolve(selection, bookmark).each(function (rng) {
                    selection.setRng(rng);
                });
            }
        }, {
            key: "isBookmarkNode",
            value: function isBookmarkNode(node) {
                return _NodeType2.default.isElement(node) && node.tagName === "SPAN" && node.getAttribute("data-editor-type") === "bookmark";
            }
        }]);

        return Bookmarks;
    }();

    exports.default = Bookmarks;
});
