(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "util/Stream", "util/Env", "util/ObjectUtil", "util/Delay"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("util/Stream"), require("util/Env"), require("util/ObjectUtil"), require("util/Delay"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.Stream, global.Env, global.ObjectUtil, global.Delay);
        global.EventUtil = mod.exports;
    }
})(this, function (exports, _Stream, _Env, _ObjectUtil, _Delay) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _Stream2 = _interopRequireDefault(_Stream);

    var _Env2 = _interopRequireDefault(_Env);

    var _ObjectUtil2 = _interopRequireDefault(_ObjectUtil);

    var _Delay2 = _interopRequireDefault(_Delay);

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

    var eventExpandoPrefix = "mce-data-",
        mouseEventRe = /^(?:mouse|contextmenu)|click/,
        deprecated = {
        keyLocation: 1,
        layerX: 1,
        layerY: 1,
        returnValue: 1,
        webkitMovementX: 1,
        webkitMovementY: 1,
        keyIdentifier: 1
    };

    var EventUtil = function () {
        function EventUtil() {
            _classCallCheck(this, EventUtil);

            this.domLoaded = false;

            // private
            this._count = 1;
            this._events = {};
            this._expando = eventExpandoPrefix + (+new Date()).toString(32);
        }

        _createClass(EventUtil, [{
            key: "bind",
            value: function bind(target, names, callback, scope) {
                this._validateTarget(target);

                var me = this,
                    events = me._events,
                    expando = me._expando,
                    id = void 0,
                    callbackList = void 0,
                    fakeName = void 0,
                    nativeHandler = void 0,
                    capture = void 0,
                    hasFocusIn = void 0,
                    hasMouseEnterLeave = void 0,
                    mouseEnterLeave = void 0;

                hasFocusIn = "onfocusin" in document.documentElement;
                hasMouseEnterLeave = "onmouseenter" in document.documentElement;
                mouseEnterLeave = {
                    mouseenter: "mouseover",
                    mouseleave: "mouseout"
                };

                if (!target[expando]) {
                    id = me._count++;
                    target[expando] = id;
                    events[id] = {};
                } else {
                    id = target[expando];
                }

                scope = scope || target;
                names = names.split(' ');

                _Stream2.default.of(names).forEach(function (i, name) {
                    nativeHandler = function nativeHandler(evt) {
                        me._executeHandlers(me._fix(evt || window.event), id);
                    };

                    fakeName = capture = false;
                    if (name === "DOMContentLoaded") {
                        name = "ready";
                    }

                    if (me.domLoaded && name === "ready" && target.readyState === "complete") {
                        callback.call(scope, me._fix({ type: name }));
                        return true;
                    }

                    if (!hasMouseEnterLeave) {
                        fakeName = mouseEnterLeave[name];

                        if (fakeName) {
                            nativeHandler = function nativeHandler(evt) {
                                var current = evt.currentTarget,
                                    related = evt.relatedTarget;

                                if (related && current.contains) {
                                    related = current.contains(related);
                                } else {
                                    while (related && related !== current) {
                                        related = related.parentNode;
                                    }
                                }

                                if (!related) {
                                    evt = me._fix(evt || window.event);
                                    evt.type = evt.type === "mouseout" ? "mouseleave" : "mouseenter";
                                    evt.target = current;
                                    me._executeHandlers(evt, id);
                                }
                            };
                        }
                    }

                    if (!hasFocusIn && (name === "focusin" || name === "focusout")) {
                        capture = true;
                        fakeName = name === "focusin" ? "focus" : "blur";
                        nativeHandler = function nativeHandler(evt) {
                            evt = me._fix(evt || win.event);
                            evt.type = evt.type === "focus" ? "focusin" : "focusout";
                            me._executeHandlers(evt, id);
                        };
                    }

                    callbackList = events[id][name];

                    if (!callbackList) {
                        events[id][name] = callbackList = [{
                            func: callback,
                            scope: scope
                        }];
                        callbackList.fakeName = fakeName;
                        callbackList.capture = capture;
                        callbackList.nativeHandler = nativeHandler;

                        if (name === "ready") {
                            me._bindOnReady(target, nativeHandler);
                        } else {
                            me._addEvent(target, fakeName || name, nativeHandler, capture);
                        }
                    } else {
                        if (name === "ready" && me.domLoaded) {
                            callback({ type: name });
                        } else {
                            callbackList.push({
                                func: callback,
                                scope: scope
                            });
                        }
                    }
                });
                target = callbackList = 0;

                return me;
            }
        }, {
            key: "unbind",
            value: function unbind(target, names, callback) {
                this._validateTarget(target);

                var me = this,
                    expando = me._expando,
                    id = target[expando];
                if (!id) {
                    return me;
                }

                var events = me._events,
                    callbackList = void 0,
                    eventMap = events[id],
                    nativeHandler = void 0,
                    fakeName = void 0,
                    capture = void 0;
                if (names) {
                    _Stream2.default.of(names.split(' ')).forEach(function (i, name) {
                        callbackList = eventMap[name];
                        if (!callbackList) return;

                        if (callback) {
                            _Stream2.default.of(callbackList).forEach(function (ci, cb) {
                                if (cb.func === callback) {
                                    nativeHandler = callbackList.nativeHandler;
                                    fakeName = callbackList.fakeName;
                                    capture = callbackList.capture;

                                    callbackList = callbackList.slice(0, ci).concat(callbackList.slice(ci + 1));
                                    callbackList.nativeHandler = nativeHandler;
                                    callbackList.fakeName = fakeName;
                                    callbackList.capture = capture;

                                    eventMap[name] = callbackList;
                                }
                            });
                        }

                        if (!callback || callbackList.length === 0) {
                            delete eventMap[name];
                            me._removeEvent(target, callbackList.fakeName || name, callbackList.nativeHandler, callbackList.capture);
                        }
                    });
                } else {
                    _Stream2.default.of(eventMap).forEach(function (name) {
                        callbackList = eventMap[name];
                        me._removeEvent(target, callbackList.fakeName || name, callbackList.nativeHandler, callbackList.capture);
                    });
                    eventMap = {};
                }

                if (_ObjectUtil2.default.isEmpty(eventMap)) {
                    delete events[id];
                    try {
                        delete target[expando];
                    } catch (ex) {
                        target[expando] = null;
                    }
                }

                return me;
            }
        }, {
            key: "fire",
            value: function fire(target, name, args) {
                this._validateTarget(target);

                var me = this,
                    id = void 0,
                    expando = me._expando;

                args = me._fix(null, args);
                args.type = name;
                args.target = target;

                do {
                    id = target[expando];
                    if (id) {
                        me._executeHandlers(args, id);
                    }
                    target = target.parentNode || target.ownerDocument || target.defaultView || target.parentWindow;
                } while (target && !args.isPropagationStopped());

                return me;
            }
        }, {
            key: "clean",
            value: function clean(target) {
                this._validateTarget(target);

                var me = this,
                    children = void 0;

                me.unbind(target);
                if (target.getElementsByTagName) {
                    children = target.getElementsByTagName('*');
                    _Stream2.default.of(children).forEach(function (i, child) {
                        me.unbind(child);
                    });
                }

                return me;
            }
        }, {
            key: "destroy",
            value: function destroy() {
                this._events = {};
            }
        }, {
            key: "cancel",
            value: function cancel(e) {
                if (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
                return false;
            }
        }, {
            key: "_returnTrue",
            value: function _returnTrue() {
                return true;
            }
        }, {
            key: "_returnFalse",
            value: function _returnFalse() {
                return false;
            }
        }, {
            key: "_hasIsDefaultPrevented",
            value: function _hasIsDefaultPrevented(event) {
                var me = this;
                return event.isDefaultPrevented === me._returnTrue || event.isDefaultPrevented === me._returnFalse;
            }
        }, {
            key: "_getTargetFromShadowDom",
            value: function _getTargetFromShadowDom(event, defaultTarget) {
                if (event.composedPath) {
                    var composedPath = event.composedPath();

                    if (composedPath && composedPath.length > 0) {
                        return composedPath[0];
                    }
                }

                return defaultTarget;
            }
        }, {
            key: "_fix",
            value: function _fix(originalEvent, data) {
                var me = this,
                    event = data || {},
                    returnTrue = me._returnTrue,
                    returnFalse = me._returnFalse,
                    eventDoc = void 0,
                    doc = void 0,
                    body = void 0;

                _Stream2.default.of(originalEvent).forEach(function (key, val) {
                    if (!deprecated[key]) {
                        event[key] = val;
                    }
                });

                if (!event.target) {
                    event.target = event.srcElement || document;
                }

                if (_Env2.default.experimentalShadowDom) {
                    event.target = me._getTargetFromShadowDom(originalEvent, event.target);
                }

                if (originalEvent && mouseEventRe.test(originalEvent.type) && originalEvent.pageX === undefined && originalEvent.clientX !== undefined) {
                    eventDoc = event.target.ownerDocument || document;
                    doc = eventDoc.documentElement;
                    body = eventDoc.body;

                    event.pageX = originalEvent.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                    event.pageY = originalEvent.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
                }

                event.preventDefault = function () {
                    event.isDefaultPrevented = returnTrue;

                    if (originalEvent) {
                        if (originalEvent.preventDefault) {
                            originalEvent.preventDefault();
                        } else {
                            originalEvent.returnValue = false;
                        }
                    }
                };

                event.stopPropagation = function () {
                    event.isPropagationStopped = returnTrue;

                    if (originalEvent) {
                        if (originalEvent.stopPropagation) {
                            originalEvent.stopPropagation();
                        } else {
                            originalEvent.cancelBubble = true;
                        }
                    }
                };

                event.stopImmediatePropagation = function () {
                    event.isImmediatePropagationStopped = returnTrue;
                    event.stopPropagation();
                };

                if (me._hasIsDefaultPrevented(event) === false) {
                    event.isDefaultPrevented = returnFalse;
                    event.isPropagationStopped = returnFalse;
                    event.isImmediatePropagationStopped = returnFalse;
                }

                if (_ObjectUtil2.default.isUndefined(event.metaKey)) {
                    event.metaKey = false;
                }

                return event;
            }
        }, {
            key: "_validateTarget",
            value: function _validateTarget(target) {
                if (!target || target.nodeType === 3 || target.nodeType === 8) {
                    throw "Invalid target";
                }
            }
        }, {
            key: "_executeHandlers",
            value: function _executeHandlers(evt, id) {
                var me = this,
                    events = me._events,
                    callbackList = events[id] && events[id][evt.type];

                _Stream2.default.of(callbackList).forEach(function (i, cb) {
                    if (cb && cb.func.call(cb.scope, evt) === false) {
                        evt.preventDefault();
                    }
                    if (evt.isImmediatePropagationStopped()) {
                        return false;
                    }
                });
            }
        }, {
            key: "_addEvent",
            value: function _addEvent(target, name, callback, capture) {
                if (target.addEventListener) {
                    target.addEventListener(name, callback, capture || false);
                } else if (target.attachEvent) {
                    target.attachEvent("on" + name, callback);
                }
            }
        }, {
            key: "_removeEvent",
            value: function _removeEvent(target, name, callback, capture) {
                if (target.removeEventListener) {
                    target.removeEventListener(name, callback, capture || false);
                } else if (target.detachEvent) {
                    target.detachEvent("on" + name, callback);
                }
            }
        }, {
            key: "_bindOnReady",
            value: function _bindOnReady(win, callback) {
                var me = this,
                    doc = win.document,
                    event = { type: "ready" };

                if (me.domLoaded) {
                    callback(event);
                    return;
                }

                var isDocReady = function isDocReady() {
                    return doc.readyState === "complete" || doc.readyState === "interactive" && doc.body;
                };

                var readyHandler = function readyHandler() {
                    me._removeEvent(win, "DOMContentLoaded", readyHandler);
                    me._removeEvent(win, "load", readyHandler);
                    if (!me.domLoaded) {
                        me.domLoaded = true;
                        callback(event);
                    }
                };

                var waitForDomLoaded = function waitForDomLoaded() {
                    if (isDocReady()) {
                        me._removeEvent(doc, "readystatechange", waitForDomLoaded);
                        readyHandler();
                    }
                };

                var tryScroll = function tryScroll() {
                    try {
                        doc.documentElement.doScroll("left");
                    } catch (ex) {
                        _Delay2.default.setTimeout(tryScroll);
                        return;
                    }
                    readyHandler();
                };

                if (doc.addEventListener && !(_Env2.default.ie && _Env2.default.ie < 11)) {
                    if (isDocReady()) {
                        readyHandler();
                    } else {
                        me._addEvent(win, "DOMContentLoaded", readyHandler);
                    }
                } else {
                    me._addEvent(doc, "readystatechange", waitForDomLoaded);
                    if (doc.documentElement.doScroll && win.me === win.top) {
                        tryScroll();
                    }
                }
                me._addEvent(win, "load", readyHandler);
            }
        }]);

        return EventUtil;
    }();

    exports.default = EventUtil;
});
