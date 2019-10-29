(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "admin/common/utils/ObjectUtil"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("admin/common/utils/ObjectUtil"));
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports, global.ObjectUtil);
		global.NavbarDropdown = mod.exports;
	}
})(this, function (exports, _ObjectUtil) {
	"use strict";

	Object.defineProperty(exports, "__esModule", {
		value: true
	});

	var _ObjectUtil2 = _interopRequireDefault(_ObjectUtil);

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

	var idGenerator = _ObjectUtil2.default.getIdGenerator("Dropdown");

	var NavbarDropdown = function (_React$Component) {
		_inherits(NavbarDropdown, _React$Component);

		function NavbarDropdown(props) {
			_classCallCheck(this, NavbarDropdown);

			var _this = _possibleConstructorReturn(this, (NavbarDropdown.__proto__ || Object.getPrototypeOf(NavbarDropdown)).call(this, props));

			_this.toggle = props.toggle;
			_this.menu = props.menu;
			return _this;
		}

		_createClass(NavbarDropdown, [{
			key: "render",
			value: function render() {
				var toggleId = this.toggle.id || idGenerator.nextId(),
				    toggleIconCls = _ObjectUtil2.default.join(["cms-icon fa", this.toggle.iconCls], ' '),
				    toggleTextCls = _ObjectUtil2.default.join(["badge", this.toggle.textCls], ' '),
				    menuHeaderIconCls = _ObjectUtil2.default.join(["cms-icon fa", this.menu.header.iconCls], ' ');

				return [React.createElement(
					"a",
					{ href: "javascript:void(0)", "data-toggle": "dropdown", id: toggleId, className: "dropdown-toggle" },
					React.createElement("i", { "class": toggleIconCls }),
					React.createElement(
						"span",
						{ "class": toggleTextCls },
						this.toggle.text
					)
				), React.createElement(
					"ul",
					{ "class": "dropdown-menu dropdown-navbar dropdown-caret dropdown-menu-right dropdown-close", "aria-labelledby": toggleId },
					React.createElement(
						"li",
						{ "class": "dropdown-header" },
						React.createElement("i", { "class": menuHeaderIconCls }),
						this.menu.header.text
					),
					React.createElement(
						"li",
						{ "class": "dropdown-content" },
						React.createElement(
							"ul",
							{ "class": "dropdown-menu dropdown-navbar" },
							this.menu.content
						)
					),
					React.createElement(
						"li",
						{ "class": "dropdown-footer" },
						React.createElement(
							"a",
							{ href: this.menu.footer.href },
							React.createElement(
								"span",
								null,
								this.menu.footer.text
							),
							React.createElement("i", { "class": "cms-icon fa fa-arrow-right" })
						)
					)
				)];
			}
		}]);

		return NavbarDropdown;
	}(React.Component);

	exports.default = NavbarDropdown;
});
