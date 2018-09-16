(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "admin/elements/dropdown/NavbarDropdown"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("admin/elements/dropdown/NavbarDropdown"));
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports, global.NavbarDropdown);
		global.TopNavbar = mod.exports;
	}
})(this, function (exports, _NavbarDropdown) {
	"use strict";

	Object.defineProperty(exports, "__esModule", {
		value: true
	});

	var _NavbarDropdown2 = _interopRequireDefault(_NavbarDropdown);

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

	function getCategoryList() {
		var categoryList = [];

		categoryList.push([React.createElement(
			"li",
			null,
			React.createElement(
				"a",
				{ href: "#" },
				React.createElement(
					"div",
					{ "class": "clearfix" },
					React.createElement(
						"span",
						{ "class": "pull-left badge badge-success" },
						"\u65C5\u6E38"
					),
					React.createElement(
						"span",
						{ "class": "pull-right badge badge-info" },
						"+12"
					)
				)
			)
		), React.createElement(
			"li",
			null,
			React.createElement(
				"a",
				{ href: "#" },
				React.createElement(
					"div",
					{ "class": "clearfix" },
					React.createElement(
						"span",
						{ "class": "pull-left badge badge-success" },
						"\u6444\u5F71"
					),
					React.createElement(
						"span",
						{ "class": "pull-right badge badge-info" },
						"+24"
					)
				)
			)
		), React.createElement(
			"li",
			null,
			React.createElement(
				"a",
				{ href: "#" },
				React.createElement(
					"div",
					{ "class": "clearfix" },
					React.createElement(
						"span",
						{ "class": "pull-left badge badge-success" },
						"\u97F3\u4E50"
					),
					React.createElement(
						"span",
						{ "class": "pull-right badge badge-info" },
						"+24"
					)
				)
			)
		), React.createElement(
			"li",
			null,
			React.createElement(
				"a",
				{ href: "#" },
				React.createElement(
					"div",
					{ "class": "clearfix" },
					React.createElement(
						"span",
						{ "class": "pull-left badge badge-success" },
						"\u89C6\u9891"
					),
					React.createElement(
						"span",
						{ "class": "pull-right badge badge-info" },
						"+24"
					)
				)
			)
		)]);

		return categoryList;
	}

	function getContentList() {
		var contentList = [];

		contentList.push([React.createElement(
			"li",
			null,
			React.createElement(
				"a",
				{ href: "#" },
				React.createElement(
					"div",
					{ "class": "clearfix" },
					React.createElement(
						"div",
						{ "class": "content-header" },
						React.createElement(
							"span",
							{ "class": "content-title" },
							"\u4E91\u5357\u65C5\u6E38\u5F52\u6765"
						),
						React.createElement(
							"span",
							{ "class": "content-tag badge badge-info" },
							"\u65C5\u6E38"
						)
					),
					React.createElement(
						"div",
						{ "class": "content-footer" },
						React.createElement("i", { "class": "cms-icon fa fa-clock-o" }),
						React.createElement(
							"span",
							null,
							"1 \u5C0F\u65F6\u4EE5\u524D"
						)
					)
				)
			)
		), React.createElement(
			"li",
			null,
			React.createElement(
				"a",
				{ href: "#" },
				React.createElement(
					"div",
					{ "class": "clearfix" },
					React.createElement(
						"div",
						{ "class": "content-header" },
						React.createElement(
							"span",
							{ "class": "content-title" },
							"\u6211\u4E0D\u662F\u836F\u795E"
						),
						React.createElement(
							"span",
							{ "class": "content-tag badge badge-info" },
							"\u7535\u5F71"
						)
					),
					React.createElement(
						"div",
						{ "class": "content-footer" },
						React.createElement("i", { "class": "cms-icon fa fa-clock-o" }),
						React.createElement(
							"span",
							null,
							"5 \u5206\u949F\u4EE5\u524D"
						)
					)
				)
			)
		)]);

		return contentList;
	}

	var TopNavBar = function (_React$Component) {
		_inherits(TopNavBar, _React$Component);

		function TopNavBar(props) {
			_classCallCheck(this, TopNavBar);

			return _possibleConstructorReturn(this, (TopNavBar.__proto__ || Object.getPrototypeOf(TopNavBar)).call(this, props));
		}

		_createClass(TopNavBar, [{
			key: "render",
			value: function render() {
				return React.createElement(
					"div",
					{ id: "navbar", "class": "navbar navbar-default" },
					React.createElement(
						"div",
						{ "class": "navbar-container", id: "navbar-container" },
						React.createElement(
							"button",
							{ type: "button", "class": "navbar-toggle menu-toggler pull-left", id: "menu-toggler" },
							React.createElement(
								"span",
								{ "class": "sr-only" },
								"Toggle sidebar"
							),
							React.createElement("span", { "class": "icon-bar" }),
							React.createElement("span", { "class": "icon-bar" }),
							React.createElement("span", { "class": "icon-bar" })
						),
						React.createElement(
							"div",
							{ "class": "navbar-header pull-left" },
							React.createElement(
								"a",
								{ href: "#", "class": "navbar-brand" },
								React.createElement(
									"small",
									null,
									React.createElement("i", { "class": "cms-icon fa fa-snowflake-o" }),
									React.createElement(
										"span",
										null,
										"StarCMS"
									)
								)
							)
						)
					),
					React.createElement(
						"div",
						{ "class": "navbar-buttons navbar-header pull-right", role: "navigation" },
						React.createElement(
							"ul",
							{ "class": "nav cms-nav" },
							React.createElement(
								"li",
								{ "class": "grey" },
								React.createElement(_NavbarDropdown2.default, { toggle: { iconCls: "fa-th-list", textCls: "badge-success", text: "4" },
									menu: { header: { iconCls: "fa-th-list", text: "共有 4 种分类" }, content: getCategoryList(), footer: { href: "#", text: "查看更多分类" } }
								})
							),
							React.createElement(
								"li",
								{ "class": "green" },
								React.createElement(_NavbarDropdown2.default, { toggle: { iconCls: "fa-th", textCls: "badge-success", text: "6" },
									menu: { header: { iconCls: "fa-th", text: "共有 6 篇文章" }, content: getContentList(), footer: { href: "#", text: "查看更多文章" } }
								})
							)
						)
					)
				);
			}
		}]);

		return TopNavBar;
	}(React.Component);

	exports.default = TopNavBar;


	ReactDOM.render(React.createElement(TopNavBar, null), document.getElementById("Main"));
});
