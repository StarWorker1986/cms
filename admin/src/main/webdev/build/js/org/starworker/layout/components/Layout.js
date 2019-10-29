(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports', 'layout/components/LayoutRow'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('layout/components/LayoutRow'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.LayoutRow);
        global.Layout = mod.exports;
    }
})(this, function (exports, _LayoutRow) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _LayoutRow2 = _interopRequireDefault(_LayoutRow);

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

    var Layout = function (_React$Component) {
        _inherits(Layout, _React$Component);

        function Layout(props) {
            _classCallCheck(this, Layout);

            var _this = _possibleConstructorReturn(this, (Layout.__proto__ || Object.getPrototypeOf(Layout)).call(this, props));

            _this._layoutHistory = [''];
            _this._layoutCursor = 0;
            _this._layoutContent = '';
            _this._dragging = false;
            return _this;
        }

        _createClass(Layout, [{
            key: 'render',
            value: function render() {
                this.__init();
                return React.createElement(
                    'div',
                    { 'class': 'container-fluid' },
                    React.createElement(
                        'div',
                        { 'class': 'btn-group btn-back-edit', role: 'group' },
                        React.createElement(
                            'button',
                            { type: 'button', id: 'backToLayoutEditBtn', 'class': 'btn btn-default btn-sm' },
                            React.createElement('i', { 'class': 'fa fa-arrow-left' }),
                            '\u8FD4\u56DE'
                        ),
                        React.createElement(
                            'button',
                            { type: 'button', 'class': 'btn btn-default btn-sm active' },
                            React.createElement('i', { 'class': 'fa fa-eye' }),
                            '\u9884\u89C8'
                        )
                    ),
                    React.createElement(
                        'div',
                        { 'class': 'layout-top-navbar' },
                        React.createElement(
                            'div',
                            { 'class': 'btn-toolbar', role: 'toolbar' },
                            React.createElement(
                                'div',
                                { 'class': 'btn-group', role: 'group' },
                                React.createElement(
                                    'button',
                                    { type: 'button', 'class': 'btn btn-default active', 'data-toggle': 'tooltip', title: '\u7F16\u8F91' },
                                    React.createElement('i', { 'class': 'fa fa-edit' })
                                ),
                                React.createElement(
                                    'button',
                                    { type: 'button', id: 'layoutPreviewBtn', 'class': 'btn btn-default', 'data-toggle': 'tooltip', title: '\u9884\u89C8' },
                                    React.createElement('i', { 'class': 'fa fa-eye' })
                                ),
                                React.createElement(
                                    'button',
                                    { type: 'button', id: 'layoutClearBtn', 'class': 'btn btn-default', 'data-toggle': 'tooltip', title: '\u6E05\u9664' },
                                    React.createElement('i', { 'class': 'fa fa-eraser' })
                                ),
                                React.createElement(
                                    'button',
                                    { type: 'button', id: 'layoutUndoBtn', 'class': 'btn btn-default', 'data-toggle': 'tooltip', title: '\u64A4\u9500' },
                                    React.createElement('i', { 'class': 'fa fa-undo' })
                                ),
                                React.createElement(
                                    'button',
                                    { type: 'button', id: 'layoutRedoBtn', 'class': 'btn btn-default', 'data-toggle': 'tooltip', title: '\u91CD\u505A' },
                                    React.createElement('i', { 'class': 'fa fa-repeat' })
                                )
                            )
                        )
                    ),
                    React.createElement(
                        'div',
                        { 'class': 'layout-side-navbar' },
                        React.createElement(
                            'a',
                            { href: '#', 'class': 'layout-brand' },
                            React.createElement('i', { 'class': 'fa fa-th-large' }),
                            '\u53EF\u89C6\u5316\u6587\u672C\u7F16\u8F91\u5668'
                        ),
                        React.createElement(_LayoutRow2.default, { spans: [12] }),
                        React.createElement(_LayoutRow2.default, { spans: [6, 6] }),
                        React.createElement(_LayoutRow2.default, { spans: [4, 8] }),
                        React.createElement(_LayoutRow2.default, { spans: [8, 4] }),
                        React.createElement(_LayoutRow2.default, { spans: [4, 4, 4] }),
                        React.createElement(_LayoutRow2.default, { spans: [3, 3, 3, 3] })
                    ),
                    React.createElement('div', { 'class': 'layout-panel ui-sortable' })
                );
            }
        }, {
            key: '__init',
            value: function __init() {
                var self = this;
                $(document).ready(function () {
                    $("[data-toggle='tooltip']").tooltip({
                        container: "body",
                        placement: "bottom",
                        trigger: "hover"
                    });
                    $("body").css("min-height", $(window).height() - 90);
                    $(".layout-panel").css("min-height", $(window).height() - 160);

                    self.__initPanel();
                    self.__initRow();
                    self.__initColumn();
                    self.__registerEvent();
                });
            }
        }, {
            key: '__initPanel',
            value: function __initPanel() {
                var self = this;
                $(".layout-panel").sortable({
                    connectWith: ".ui-sortable",
                    handle: ".drag",
                    start: function start(e, t) {
                        self._dragging = true;
                    },
                    sort: function sort(e, t) {
                        self.__onSort(t.helper);
                    },
                    stop: function stop(e, t) {
                        self.__onSortStop(t.item[0]);
                    }
                }).delegate(".remove", "click", function (e) {
                    e.preventDefault();
                    $(this).parent().remove();
                    if (!$(".layout-panel .view").length) {
                        self.__clearPanel();
                    }
                    self.__handleMouseUp();
                }).mouseup(function () {
                    if (!self._dragging) return false;
                    self.__handleMouseUp();
                });
            }
        }, {
            key: '__initRow',
            value: function __initRow() {
                var self = this;
                $(".layout-row").draggable({
                    connectToSortable: ".ui-sortable",
                    helper: function helper(elm) {
                        return $(elm.currentTarget).find(".view").clone();
                    },
                    handle: ".drag",
                    start: function start(e, t) {
                        self._dragging = true;
                    },
                    drag: function drag(e, t) {
                        t.helper.width(300);
                    },
                    stop: function stop(e, t) {
                        self.__initColumn();
                    }
                });
            }
        }, {
            key: '__initColumn',
            value: function __initColumn() {
                var self = this;
                $(".ui-sortable .layout-column").sortable({
                    connectWith: ".ui-sortable",
                    handle: ".drag",
                    start: function start(e, t) {
                        self._dragging = true;
                    },
                    sort: function sort(e, t) {
                        self.__onSort(t.helper);
                    },
                    stop: function stop(e, t) {
                        self.__onSortStop(t.item[0]);
                    }
                });
            }
        }, {
            key: '__onSort',
            value: function __onSort(helper) {
                var width = helper.parent().width(),
                    left = parseInt(helper.css("left")),
                    views = helper.find(".view");
                helper.css("left", width + left - 300 + "px");
                helper.width(300);
                for (var i = 0; i < views.length; i++) {
                    $(views[i]).css("display", "none");
                }
            }
        }, {
            key: '__onSortStop',
            value: function __onSortStop(target) {
                $(target).removeAttr("style");
                var views = $(target).find(".view");
                for (var i = 0; i < views.length; i++) {
                    $(views[i]).removeAttr("style");
                }
            }
        }, {
            key: '__registerEvent',
            value: function __registerEvent() {
                var self = this;
                $(window).resize(function () {
                    $("body").css("min-height", $(window).height() - 90);
                    $(".layout-panel").css("min-height", $(window).height() - 160);
                });

                $("#layoutClearBtn").click(function () {
                    self.__clearPanel();
                });
                $("#layoutPreviewBtn").click(function () {
                    $("body").removeClass("layout-edit").addClass("layout-preview");
                });
                $("#backToLayoutEditBtn").click(function () {
                    $("body").removeClass("layout-preview").addClass("layout-edit");
                });
                $("#layoutUndoBtn").click(function () {
                    self.__undoLayout();
                });
                $("#layoutRedoBtn").click(function () {
                    self.__redoLayout();
                });
            }
        }, {
            key: '__saveLayout',
            value: function __saveLayout() {
                var currentContent = $(".layout-panel").html();
                if (currentContent != this._layoutContent) {
                    var maxCursor = this._layoutHistory.length - 1;

                    if (this._layoutCursor < maxCursor) {
                        for (var i = this._layoutCursor; i < maxCursor; i++) {
                            this._layoutHistory.pop();
                        }
                    }

                    this._layoutHistory.push(currentContent);
                    this._layoutContent = currentContent;
                    this._layoutCursor++;
                }
            }
        }, {
            key: '__undoLayout',
            value: function __undoLayout() {
                if (this._layoutCursor > 0) {
                    this._layoutCursor--;
                    this._layoutContent = this._layoutHistory[this._layoutCursor];
                    $(".layout-panel").html(this._layoutContent);
                }
            }
        }, {
            key: '__redoLayout',
            value: function __redoLayout() {
                if (this._layoutCursor < this._layoutHistory.length - 1) {
                    this._layoutCursor++;
                    this._layoutContent = this._layoutHistory[this._layoutCursor];
                    $(".layout-panel").html(this._layoutContent);
                    this.__initColumn();
                }
            }
        }, {
            key: '__clearPanel',
            value: function __clearPanel() {
                $(".layout-panel").empty();
                this._layoutHistory = [''];
                this._layoutCursor = 0;
                this._layoutContent = '';
                this._dragging = false;
            }
        }, {
            key: '__handleMouseUp',
            value: function __handleMouseUp() {
                var self = this;
                $("#layoutUndoBtn").attr("disabled", true);
                $("#layoutRedoBtn").attr("disabled", true);
                setTimeout(function () {
                    self.__saveLayout();
                    self._dragging = false;
                    $("#layoutUndoBtn").removeAttr("disabled");
                    $("#layoutRedoBtn").removeAttr("disabled");
                }, 10);
            }
        }]);

        return Layout;
    }(React.Component);

    exports.default = Layout;
});
