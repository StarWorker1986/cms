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
		global.DefaultDropdown = mod.exports;
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

	var Dropdown = function (_React$Component) {
		_inherits(Dropdown, _React$Component);

		function Dropdown(props) {
			_classCallCheck(this, Dropdown);

			var _this = _possibleConstructorReturn(this, (Dropdown.__proto__ || Object.getPrototypeOf(Dropdown)).call(this, props));

			_this.toggle = props.toggle;
			_this.menu = props.menu;
			return _this;
		}

		_createClass(Dropdown, [{
			key: "render",
			value: function render() {
				var toggleId = this.toggle.id || idGenerator.nextId(),
				    toggleClass = _ObjectUtil2.default.join(["dropdown-toggle", this.toggle.className], ' '),
				    menuClass = _ObjectUtil2.default.join(["dropdown-menu", this.menu.className], ' ');

				return React.createElement(
					"div",
					{ "class": "dropdown" },
					React.createElement(
						"a",
						{ href: "javascript:void(0)", "data-toggle": "dropdown", id: toggleId, className: toggleClass },
						this.toggle.content
					),
					React.createElement(
						"div",
						{ "class": menuClass, "aria-labelledby": toggleId },
						this.menu.content
					)
				);
			}
		}]);

		return Dropdown;
	}(React.Component);

	exports.default = Dropdown;
});
