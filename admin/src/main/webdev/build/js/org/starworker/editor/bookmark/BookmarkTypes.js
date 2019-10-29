(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "../util/Tools"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("../util/Tools"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.Tools);
        global.BookmarkTypes = mod.exports;
    }
})(this, function (exports, _Tools) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

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

    var BookmarkTypes = function () {
        function BookmarkTypes() {
            _classCallCheck(this, BookmarkTypes);
        }

        _createClass(BookmarkTypes, null, [{
            key: "isStringPathBookmark",
            value: function isStringPathBookmark(bookmark) {
                return typeof bookmark.start === "string";
            }
        }, {
            key: "isRangeBookmark",
            value: function isRangeBookmark(bookmark) {
                return bookmark.hasOwnProperty("rng");
            }
        }, {
            key: "isIdBookmark",
            value: function isIdBookmark(bookmark) {
                return bookmark.hasOwnProperty("id");
            }
        }, {
            key: "isIndexBookmark",
            value: function isIndexBookmark(bookmark) {
                return bookmark.hasOwnProperty("name");
            }
        }, {
            key: "isPathBookmark",
            value: function isPathBookmark(bookmark) {
                return _Tools2.default.isArray(bookmark.start);
            }
        }]);

        return BookmarkTypes;
    }();

    exports.default = BookmarkTypes;
});
