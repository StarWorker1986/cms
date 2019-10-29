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
        global.LayoutRow = mod.exports;
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

    var LayoutRow = function (_React$Component) {
        _inherits(LayoutRow, _React$Component);

        function LayoutRow(props) {
            _classCallCheck(this, LayoutRow);

            var _this = _possibleConstructorReturn(this, (LayoutRow.__proto__ || Object.getPrototypeOf(LayoutRow)).call(this, props));

            _this.spans = props.spans;
            return _this;
        }

        _createClass(LayoutRow, [{
            key: "render",
            value: function render() {
                return React.createElement(
                    "div",
                    { "class": "layout-row" },
                    React.createElement(
                        "div",
                        { "class": "preview" },
                        React.createElement(
                            "div",
                            { "class": "row" },
                            React.createElement(
                                "div",
                                { "class": "col-md-6 col-md-offset-1 layout-column" },
                                React.createElement("input", { type: "text", "class": "form-control", value: this.__getValue(), disabled: true })
                            ),
                            React.createElement(
                                "div",
                                { "class": "col-md-3 col-md-offset-1 layout-column" },
                                React.createElement(
                                    "span",
                                    { "class": "label label-default col-md-12 drag" },
                                    React.createElement("i", { "class": "fa fa-arrows" }),
                                    "\u62D6\u52A8"
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { "class": "view" },
                        React.createElement(
                            "div",
                            { "class": "row" },
                            React.createElement(
                                "span",
                                { "class": "label label-default drag" },
                                React.createElement("i", { "class": "fa fa-arrows" }),
                                "\u62D6\u52A8"
                            ),
                            React.createElement(
                                "span",
                                { "class": "label label-danger remove" },
                                React.createElement("i", { "class": "fa fa-remove" }),
                                "\u5220\u9664"
                            ),
                            this.__getDivs()
                        )
                    )
                );
            }
        }, {
            key: "__getValue",
            value: function __getValue() {
                return this.spans.join(" ");
            }
        }, {
            key: "__getDivs",
            value: function __getDivs() {
                var divs = [];
                this.spans.map(function (span) {
                    divs.push(React.createElement("div", { "class": "col-md-" + span + " layout-column" }));
                });
                return divs;
            }
        }]);

        return LayoutRow;
    }(React.Component);

    exports.default = LayoutRow;
});
