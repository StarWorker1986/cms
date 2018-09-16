(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "admin/common/utils/EnvUtils"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("admin/common/utils/EnvUtils"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.EnvUtils);
        global.Scroller = mod.exports;
    }
})(this, function (exports, _EnvUtils) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _EnvUtils2 = _interopRequireDefault(_EnvUtils);

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

    var defaultSettings = {
        "size": 200,
        "horizontal": false,
        "mouseWheel": true,
        "mouseWheelLock": false,
        "lockAnyway": false,
        "styleClass": false,
        "hoverReset": true,
        "reset": false,
        "dragEvent": false,
        "touchDrag": true,
        "touchSwipe": false,
        "scrollEvent": false
    };

    function mouseDownTrack(e, self) {
        e.preventDefault();
        e.stopPropagation();

        var _ = self._,
            trackOffset = _.$track.offset(),
            trackPos = trackOffset[_.cssPos],
            mousePos = _.vertical ? e.pageY : e.pageX;

        if (mousePos > trackPos + _.barPos) {
            _.barPos = mousePos - trackPos - _.barSize + _.barSize2;
            if (_.barPos > _.barMaxPos) {
                _.barPos = _.barMaxPos;
            }
        } else {
            _.barPos = mousePos - trackPos - _.barSize2;
            if (_.barPos < 0) _.barPos = 0;
        }

        self.updateScroll();
    }

    function mouseClickBar(e, self) {
        var _ = self._;

        if (_.mouseTrack) {
            e.preventDefault();
            e.stopPropagation();

            _.mouseTrack = false;
        }

        $(_.mouseReleaseTarget).off(".sw_scroll");
        _.$track.removeClass("active");
        if (_.dragEvent) _.$elm.trigger("drag.end");
    }

    function mouseDownBar(e, self) {
        e.preventDefault();
        e.stopPropagation();

        var _ = self._;

        if (_.vertical) {
            _.mousePos2 = _.mousePos1 = e.pageY;
        } else {
            _.mousePos2 = _.mousePos1 = e.pageX;
        }

        _.mouseTrack = true;
        $(_.mouseReleaseTarget).on("mousemove.sw_scroll", function (e) {
            mouseMoveBar(e, self);
        });

        $(_.mouseReleaseTarget).on("click.sw_scroll", function (e) {
            mouseClickBar(e, self);
        });

        _.$track.addClass("active");
        if (_.dragEvent) _.$elm.trigger("drag.start");
    }

    function mouseMoveBar(e, self) {
        e.preventDefault();
        e.stopPropagation();

        var _ = self._;

        if (_.vertical) {
            _.mousePos2 = e.pageY;
        } else {
            _.mousePos2 = e.pageX;
        }

        if (_.mousePos2 - _.mousePos1 + _.barPos > _.barMaxPos) {
            _.mousePos2 = _.mousePos1 + _.barMaxPos - _.barPos;
        } else if (_.mousePos2 - _.mousePos1 + _.barPos < 0) {
            _.mousePos2 = _.mousePos1 - _.barPos;
        }

        _.barPos = _.barPos + (_.mousePos2 - _.mousePos1);
        _.mousePos1 = _.mousePos2;

        if (_.barPos < 0) {
            _.barPos = 0;
        } else if (_.barPos > _.barMaxPos) {
            _.barPos = _.barMaxPos;
        }

        self.updateScroll();
    }

    var Dropdown = function () {
        function Dropdown(element, settings) {
            _classCallCheck(this, Dropdown);

            this.element = element;
            this.settings = $.extend({}, defaultSettings, settings);
            this.state = {
                created: false,
                disabled: false,
                active: false
            };
            var $elm = $(this.element),
                vertical = !settings["horizontal"];
            this.size = parseInt($elm.attr("data-size")) || settings.size || 200;

            this._ = {
                $elm: $elm,
                inlineStyle: null,
                vertical: vertical,
                cssPos: vertical ? "top" : "left",
                cssSize: vertical ? "height" : "width",
                maxCssSize: vertical ? "maxHeight" : "maxWidth",
                clientSize: vertical ? "clientHeight" : "clientWidth",
                scrollDirection: vertical ? "scrollTop" : "scrollLeft",
                scrollSize: vertical ? "scrollHeight" : "scrollWidth",
                contentWrap: null,
                $contentWrap: null,
                track: null,
                $track: null,
                bar: null,
                $bar: null,
                barStyle: null,
                barPos: 0,
                barSize: 0,
                barMaxPos: 0,
                barSize2: 0,
                mousePos1: -1,
                mousePos2: -1,
                mouseTrack: false,
                moveBar: true,
                mouseReleaseTarget: "html",
                dragEvent: settings.dragEvent || false,
                resetOnce: false,
                triggerScroll: settings.scrollEvent || false,
                ratio: 1
            };
        }

        _createClass(Dropdown, [{
            key: "create",
            value: function create() {
                if (this.state.created) return;

                var self = this,
                    _ = self._,
                    settings = self.settings,
                    state = self.state,
                    lock = false,
                    lockAnyway = false,
                    touchDrag = false;

                _.$elm.addClass("sw-scroll" + ((_.vertical ? '' : " scroll-hz") + (settings.styleClass ? ' ' + settings.styleClass : '')));
                if (_.$elm.css("position") === "static") {
                    _.inlineStyle = _.$elm.css("position");
                    _.$elm.css("position", "relative");
                }

                _.$elm.wrapInner('<div class="scroll-content" />');
                _.$elm.prepend('<div class="scroll-track"><div class="scroll-bar"></div></div>');

                _.$contentWrap = _.$elm.find(".scroll-content").eq(0);
                if (!_.vertical) _.$contentWrap.wrapInner("<div />");

                _.contentWrap = _.$contentWrap.get(0);
                _.$track = _.$elm.find(".scroll-track").eq(0);
                _.$bar = _.$track.find(".scroll-bar").eq(0);
                _.track = _.$track.get(0);
                _.bar = _.$bar.get(0);
                _.barStyle = _.bar.style;

                _.$track.hide();

                _.$track.on("mousedown", function (e) {
                    mouseDownTrack(e, self);
                });

                _.$bar.on("mousedown", function (e) {
                    mouseDownBar(e, self);
                });

                _.$contentWrap.on("scroll", function (e) {
                    if (_.moveBar) {
                        _.barPos = parseInt(Math.round(this[_.scrollDirection] * _.ratio));
                        _.barStyle[_.cssPos] = _.barPos + "px";
                    }
                    _.moveBar = false;
                    if (_.triggerScroll) _.$elm.trigger("scroll", [_.contentWrap]);
                });

                if (settings.mouseWheel) {
                    lock = settings.mouseWheelLock;
                    lockAnyway = settings.lockAnyway;

                    _.$elm.on("mousewheel.sw_scroll DOMMouseScroll.sw_scroll", function (event) {
                        if (state.disabled) return;
                        if (!state.active) return !lockAnyway;

                        if (_.mouseTrack) {
                            _.mouseTrack = false;
                            $("html").off(".sw_scroll");
                            $(_.mouseReleaseTarget).off(".sw_scroll");
                            if (_.dragEvent) _.$elm.trigger("drag.end");
                        }

                        var delta = event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0 ? 1 : -1,
                            clientSize = _.contentWrap[_.clientSize],
                            scrollAmount = _.contentWrap[_.scrollDirection],
                            scrollEnd = false;

                        if (!lock) {
                            if (delta == -1) scrollEnd = _.contentWrap[_.scrollSize] <= scrollAmount + clientSize;else scrollEnd = scrollAmount === 0;
                        }

                        _.moveBar = true;

                        var step = parseInt(Math.round(Math.min(Math.max(clientSize / 8, 54)), self.size)) + 1;
                        _.contentWrap[_.scrollDirection] = scrollAmount - delta * step;

                        return scrollEnd && !lockAnyway;
                    });
                }

                touchDrag = _EnvUtils2.default.touchAble() && "sw_drag" in $.event.special && settings.touchDrag;

                if (touchDrag) {
                    var dir = null,
                        dis = 0,
                        eventName = touchDrag ? "sw_drag" : "swipe";

                    _.$elm.on(eventName + ".sw_scroll", function (event) {
                        if (state.disabled) {
                            event.retval.cancel = true;
                            return;
                        }
                        if (!state.active) {
                            event.retval.cancel = lockAnyway;
                            return;
                        }

                        dir = event.direction;
                        if (_.vertical && (dir === "up" || dir === "down") || !_.vertical && (dir === "left" || dir === "right")) {
                            dis = _.vertical ? event.dy : event.dx;

                            if (dis !== 0) {
                                if (Math.abs(dis) > 20 && touchDrag) dis = dis * 2;

                                _.moveBar = true;
                                _.contentWrap[_.scrollDirection] = _.contentWrap[_.scrollDirection] + dis;
                            }
                        }
                    });
                }

                if (settings.hoverReset) {
                    _.$elm.on("mouseenter.sw_scroll touchstart.sw_scroll", function () {
                        self.reset();
                    });
                }

                if (!_.vertical) _.$contentWrap.children(0).css(_.cssSize, self.size);
                _.$contentWrap.css(_.maxCssSize, self.size);

                state.disabled = false;
                state.created = true;
            }
        }, {
            key: "reset",
            value: function reset() {
                var self = this,
                    _ = self._,
                    state = self.state,
                    settings = self.settings,
                    contentSize = 0,
                    availableSpace = 0;

                if (state.disabled) return;
                if (!state.created) self.create();

                contentSize = _.vertical ? _.contentWrap[_.scrollSize] : self.size;
                if (_.vertical && contentSize === 0 || !_.vertical && self.element.scrollWidth === 0) {
                    _.$elm.removeClass("scroll-active");
                    return;
                }

                availableSpace = _.vertical ? self.size : _.contentWrap.clientWidth;

                if (!_.vertical) _.$contentWrap.children(0).css(_.cssSize, self.size);
                _.$contentWrap.css(_.maxCssSize, self.size);

                if (contentSize > availableSpace) {
                    state.active = true;
                    _.$track.css(_.cssSize, availableSpace).show();

                    _.ratio = parseFloat((availableSpace / contentSize).toFixed(5));

                    _.barSize = parseInt(Math.round(availableSpace * _.ratio));
                    _.barSize2 = parseInt(Math.round(_.barSize / 2));

                    _.barMaxPos = availableSpace - _.barSize;
                    _.barPos = parseInt(Math.round(_.contentWrap[_.scrollDirection] * _.ratio));

                    _.barStyle[_.cssSize] = _.barSize + "px";
                    _.barStyle[_.cssPos] = _.barPos + "px";

                    _.$elm.addClass("scroll-active");

                    if (!_.resetOnce) {
                        if (settings.reset) {
                            _.contentWrap[_.scrollDirection] = 0;
                            _.barStyle[_.cssPos] = 0;
                        }
                        _.resetOnce = true;
                    }
                } else {
                    state.active = false;
                    _.$track.hide();
                    _.$elm.removeClass("scroll-active");
                    _.$contentWrap.css(_.maxCssSize, '');
                }
            }
        }, {
            key: "disable",
            value: function disable() {
                var self = this,
                    _ = self._,
                    state = self.state;

                _.contentWrap[_.scrollDirection] = 0;
                _.barStyle[_.cssPos] = 0;

                state.disabled = true;
                state.active = false;
                _.$track.hide();

                _.$elm.removeClass("scroll-active");
                _.$contentWrap.css(_.maxCssSize, '');

                return self;
            }
        }, {
            key: "enable",
            value: function enable() {
                var self = this,
                    state = self.state;

                state.disabled = false;
                self.reset();

                return self;
            }
        }, {
            key: "destroy",
            value: function destroy() {
                var self = this,
                    _ = self._,
                    settings = self.settings,
                    state = self.state;

                state.active = false;
                state.disabled = false;
                state.created = false;

                _.$elm.removeClass("sw-scroll scroll-hz" + (settings.extraClass ? ' ' + settings.extraClass : ''));
                _.$elm.off(".sw_scroll");

                if (!_.vertical) {
                    _.$contentWrap.find("> div").children().unwrap();
                }
                _.$contentWrap.children().unwrap();
                _.$contentWrap.remove();
                _.$track.remove();

                if (_.inlineStyle !== null) self.element.style.position = _.inlineStyle;

                return self;
            }
        }, {
            key: "modify",
            value: function modify(newSettings) {
                var self = this,
                    settings = self.settings;

                if (newSettings) settings = $.extend({}, defaultSettings, newSettings);

                self.destroy();
                self.create();
                self.reset();

                return self;
            }
        }, {
            key: "updateScroll",
            value: function updateScroll() {
                var _ = this._;

                _.moveBar = false;
                _.barStyle[_.cssPos] = _.barPos + "px";
                _.contentWrap[_.scrollDirection] = parseInt(Math.round(_.barPos / _.ratio));
            }
        }, {
            key: "render",
            value: function render() {
                this.create();
                this.reset();
            }
        }]);

        return Dropdown;
    }();

    exports.default = Dropdown;
});
