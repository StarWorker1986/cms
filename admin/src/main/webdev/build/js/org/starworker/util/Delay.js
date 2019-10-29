(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.Delay = mod.exports;
    }
})(this, function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

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

    var requestAnimationFramePromise = void 0;

    var Delay = function () {
        function Delay() {
            _classCallCheck(this, Delay);
        }

        _createClass(Delay, null, [{
            key: "requestAnimationFrame",
            value: function requestAnimationFrame(callback) {
                if (requestAnimationFramePromise) {
                    requestAnimationFramePromise.then(callback);
                    return;
                }

                requestAnimationFramePromise = new Promise(function (resolve) {
                    var requestAnimationFrameFunc = window.requestAnimationFrame,
                        vendors = ["ms", "moz", "webkit"];

                    for (var i = 0; i < vendors.length && !requestAnimationFrameFunc; i++) {
                        requestAnimationFrameFunc = window[vendors[i] + "RequestAnimationFrame"];
                    }
                    if (!requestAnimationFrameFunc) {
                        setTimeout(resolve, 0);
                    } else {
                        requestAnimationFrameFunc(resolve);
                    }
                }).then(callback);
            }
        }, {
            key: "setEditorTimeout",
            value: function setEditorTimeout(editor, callback, time) {
                return setTimeout(function () {
                    if (!editor.removed) {
                        callback();
                    }
                }, time);
            }
        }, {
            key: "setEditorInterval",
            value: function setEditorInterval(editor, callback, time) {
                var timer = setInterval(function () {
                    if (!editor.removed) {
                        callback();
                    } else {
                        clearInterval(timer);
                    }
                }, time);

                return timer;
            }
        }]);

        return Delay;
    }();

    exports.default = Delay;
});
