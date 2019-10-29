(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "admin/common/utils/EnvUtil"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require("admin/common/utils/EnvUtil"));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.EnvUtil);
        global.Scroller = mod.exports;
    }
})(this, function (exports, _EnvUtil) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _EnvUtil2 = _interopRequireDefault(_EnvUtil);

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

            this._$elm = $elm;
            this._inlineStyle = null;
            this._vertical = vertical;
            this._cssPos = vertical ? "top" : "left";
            this._cssSize = vertical ? "height" : "width";
            this._maxCssSize = vertical ? "maxHeight" : "maxWidth";
            this._clientSize = vertical ? "clientHeight" : "clientWidth";
            this._scrollDirection = vertical ? "scrollTop" : "scrollLeft";
            this._scrollSize = vertical ? "scrollHeight" : "scrollWidth";
            this._contentWrap = null;
            this._$contentWrap = null;
            this._track = null;
            this._$track = null;
            this._bar = null;
            this._$bar = null;
            this._barStyle = null;
            this._barPos = 0;
            this._barSize = 0;
            this._barMaxPos = 0;
            this._barSize2 = 0;
            this._mousePos1 = -1;
            this._mousePos2 = -1;
            this._mouseTrack = false;
            this._moveBar = true;
            this._mouseReleaseTarget = "html";
            this._dragEvent = settings.dragEvent || false;
            this._resetOnce = false;
            this._triggerScroll = settings.scrollEvent || false;
            this._ratio = 1;
        }

        _createClass(Dropdown, [{
            key: "create",
            value: function create() {
                if (this.state.created) return;

                var self = this,
                    settings = self.settings,
                    state = self.state,
                    lock = false,
                    lockAnyway = false,
                    touchDrag = false;

                this._$elm.addClass("sw-scroll" + ((this._vertical ? '' : " scroll-hz") + (settings.styleClass ? ' ' + settings.styleClass : '')));
                if (this._$elm.css("position") === "static") {
                    this._inlineStyle = this._$elm.css("position");
                    this._$elm.css("position", "relative");
                }

                this._$elm.wrapInner('<div class="scroll-content" />');
                this._$elm.prepend('<div class="scroll-track"><div class="scroll-bar"></div></div>');

                this._$contentWrap = this._$elm.find(".scroll-content").eq(0);
                if (!this._vertical) this._$contentWrap.wrapInner("<div />");

                this._contentWrap = this._$contentWrap.get(0);
                this._$track = this._$elm.find(".scroll-track").eq(0);
                this._$bar = this._$track.find(".scroll-bar").eq(0);
                this._track = this._$track.get(0);
                this._bar = this._$bar.get(0);
                this._barStyle = this._bar.style;

                this._$track.hide();

                this._$track.on("mousedown", function (e) {
                    mouseDownTrack(e, self);
                });

                this._$bar.on("mousedown", function (e) {
                    mouseDownBar(e, self);
                });

                this._$contentWrap.on("scroll", function (e) {
                    if (this._moveBar) {
                        this._barPos = parseInt(Math.round(this[this._scrollDirection] * this._ratio));
                        this._barStyle[this._cssPos] = this._barPos + "px";
                    }
                    this._moveBar = false;
                    if (this._triggerScroll) this._$elm.trigger("scroll", [this._contentWrap]);
                });

                if (settings.mouseWheel) {
                    lock = settings.mouseWheelLock;
                    lockAnyway = settings.lockAnyway;

                    this._$elm.on("mousewheel.sw_scroll DOMMouseScroll.sw_scroll", function (event) {
                        if (state.disabled) return;
                        if (!state.active) return !lockAnyway;

                        if (this._mouseTrack) {
                            this._mouseTrack = false;
                            $("html").off(".sw_scroll");
                            $(this._mouseReleaseTarget).off(".sw_scroll");
                            if (this._dragEvent) this._$elm.trigger("drag.end");
                        }

                        var delta = event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0 ? 1 : -1,
                            clientSize = this._contentWrap[this._clientSize],
                            scrollAmount = this._contentWrap[this._scrollDirection],
                            scrollEnd = false;

                        if (!lock) {
                            if (delta == -1) scrollEnd = this._contentWrap[this._scrollSize] <= scrollAmount + clientSize;else scrollEnd = scrollAmount === 0;
                        }

                        this._moveBar = true;

                        var step = parseInt(Math.round(Math.min(Math.max(clientSize / 8, 54)), self.size)) + 1;
                        this._contentWrap[this._scrollDirection] = scrollAmount - delta * step;

                        return scrollEnd && !lockAnyway;
                    });
                }

                touchDrag = _EnvUtil2.default.touchAble() && "sw_drag" in $.event.special && settings.touchDrag;

                if (touchDrag) {
                    var dir = null,
                        dis = 0,
                        eventName = touchDrag ? "sw_drag" : "swipe";

                    this._$elm.on(eventName + ".sw_scroll", function (event) {
                        if (state.disabled) {
                            event.retval.cancel = true;
                            return;
                        }
                        if (!state.active) {
                            event.retval.cancel = lockAnyway;
                            return;
                        }

                        dir = event.direction;
                        if (this._vertical && (dir === "up" || dir === "down") || !this._vertical && (dir === "left" || dir === "right")) {
                            dis = this._vertical ? event.dy : event.dx;

                            if (dis !== 0) {
                                if (Math.abs(dis) > 20 && touchDrag) dis = dis * 2;

                                this._moveBar = true;
                                this._contentWrap[this._scrollDirection] = this._contentWrap[this._scrollDirection] + dis;
                            }
                        }
                    });
                }

                if (settings.hoverReset) {
                    this._$elm.on("mouseenter.sw_scroll touchstart.sw_scroll", function () {
                        self.reset();
                    });
                }

                if (!this._vertical) this._$contentWrap.children(0).css(this._cssSize, self.size);
                this._$contentWrap.css(this._maxCssSize, self.size);

                state.disabled = false;
                state.created = true;
            }
        }, {
            key: "reset",
            value: function reset() {
                var self = this,
                    state = self.state,
                    settings = self.settings,
                    contentSize = 0,
                    availableSpace = 0;

                if (state.disabled) return;
                if (!state.created) self.create();

                contentSize = this._vertical ? this._contentWrap[this._scrollSize] : self.size;
                if (this._vertical && contentSize === 0 || !this._vertical && self.element.scrollWidth === 0) {
                    this._$elm.removeClass("scroll-active");
                    return;
                }

                availableSpace = this._vertical ? self.size : this._contentWrap.clientWidth;

                if (!this._vertical) this._$contentWrap.children(0).css(this._cssSize, self.size);
                this._$contentWrap.css(this._maxCssSize, self.size);

                if (contentSize > availableSpace) {
                    state.active = true;
                    this._$track.css(this._cssSize, availableSpace).show();

                    this._ratio = parseFloat((availableSpace / contentSize).toFixed(5));

                    this._barSize = parseInt(Math.round(availableSpace * this._ratio));
                    this._barSize2 = parseInt(Math.round(this._barSize / 2));

                    this._barMaxPos = availableSpace - this._barSize;
                    this._barPos = parseInt(Math.round(this._contentWrap[this._scrollDirection] * this._ratio));

                    this._barStyle[this._cssSize] = this._barSize + "px";
                    this._barStyle[this._cssPos] = this._barPos + "px";

                    this._$elm.addClass("scroll-active");

                    if (!this._resetOnce) {
                        if (settings.reset) {
                            this._contentWrap[this._scrollDirection] = 0;
                            this._barStyle[this._cssPos] = 0;
                        }
                        this._resetOnce = true;
                    }
                } else {
                    state.active = false;
                    this._$track.hide();
                    this._$elm.removeClass("scroll-active");
                    this._$contentWrap.css(this._maxCssSize, '');
                }
            }
        }, {
            key: "disable",
            value: function disable() {
                var state = this.state;

                this._contentWrap[this._scrollDirection] = 0;
                this._barStyle[this._cssPos] = 0;

                state.disabled = true;
                state.active = false;
                this._$track.hide();

                this._$elm.removeClass("scroll-active");
                this._$contentWrap.css(this._maxCssSize, '');

                return this;
            }
        }, {
            key: "enable",
            value: function enable() {
                var state = this.state;

                state.disabled = false;
                this.reset();

                return this;
            }
        }, {
            key: "destroy",
            value: function destroy() {
                var settings = this.settings,
                    state = this.state;

                state.active = false;
                state.disabled = false;
                state.created = false;

                this._$elm.removeClass("sw-scroll scroll-hz" + (settings.extraClass ? ' ' + settings.extraClass : ''));
                this._$elm.off(".sw_scroll");

                if (!this._vertical) {
                    this._$contentWrap.find("> div").children().unwrap();
                }
                this._$contentWrap.children().unwrap();
                this._$contentWrap.remove();
                this._$track.remove();

                if (this._inlineStyle !== null) this.element.style.position = this._inlineStyle;

                return this;
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
                this._moveBar = false;
                this._barStyle[this._cssPos] = this._barPos + "px";
                this._contentWrap[this._scrollDirection] = parseInt(Math.round(this._barPos / this._ratio));
            }
        }, {
            key: "render",
            value: function render() {
                this.create();
                this.reset();
            }
        }, {
            key: "__mouseDownTrack",
            value: function __mouseDownTrack(e) {
                e.preventDefault();
                e.stopPropagation();

                var trackOffset = this._$track.offset(),
                    trackPos = trackOffset[this._cssPos],
                    mousePos = this._vertical ? e.pageY : e.pageX;

                if (mousePos > trackPos + this._barPos) {
                    this._barPos = mousePos - trackPos - this._barSize + this._barSize2;
                    if (this._barPos > this._barMaxPos) {
                        this._barPos = this._barMaxPos;
                    }
                } else {
                    this._barPos = mousePos - trackPos - this._barSize2;
                    if (this._barPos < 0) this._barPos = 0;
                }

                this.updateScroll();
            }
        }, {
            key: "__mouseClickBar",
            value: function __mouseClickBar(e) {
                if (this._mouseTrack) {
                    e.preventDefault();
                    e.stopPropagation();

                    this._mouseTrack = false;
                }

                $(this._mouseReleaseTarget).off(".sw_scroll");
                this._$track.removeClass("active");
                if (this._dragEvent) this._$elm.trigger("drag.end");
            }
        }, {
            key: "__mouseDownBar",
            value: function __mouseDownBar(e) {
                e.preventDefault();
                e.stopPropagation();

                if (this._vertical) {
                    this._mousePos2 = this._mousePos1 = e.pageY;
                } else {
                    this._mousePos2 = this._mousePos1 = e.pageX;
                }

                this._mouseTrack = true;
                $(this._mouseReleaseTarget).on("mousemove.sw_scroll", function (e) {
                    this.__mouseMoveBar(e);
                });

                $(this._mouseReleaseTarget).on("click.sw_scroll", function (e) {
                    this.__mouseClickBar(e, self);
                });

                this._$track.addClass("active");
                if (this._dragEvent) this._$elm.trigger("drag.start");
            }
        }, {
            key: "__mouseMoveBar",
            value: function __mouseMoveBar(e) {
                e.preventDefault();
                e.stopPropagation();

                if (this._vertical) {
                    this._mousePos2 = e.pageY;
                } else {
                    this._mousePos2 = e.pageX;
                }

                if (this._mousePos2 - this._mousePos1 + this._barPos > this._barMaxPos) {
                    this._mousePos2 = this._mousePos1 + this._barMaxPos - this._barPos;
                } else if (this._mousePos2 - this._mousePos1 + this._barPos < 0) {
                    this._mousePos2 = this._mousePos1 - this._barPos;
                }

                this._barPos = this._barPos + (this._mousePos2 - this._mousePos1);
                this._mousePos1 = this._mousePos2;

                if (this._barPos < 0) {
                    this._barPos = 0;
                } else if (this._barPos > this._barMaxPos) {
                    this._barPos = this._barMaxPos;
                }

                this.updateScroll();
            }
        }]);

        return Dropdown;
    }();

    exports.default = Dropdown;
});
