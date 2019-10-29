(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "util/ObjectUtil"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("util/ObjectUtil"));
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports, global.ObjectUtil);
		global.Stream = mod.exports;
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

	var isObject = _ObjectUtil2.default.isObject,
	    isArry = _ObjectUtil2.default.isArry,
	    isString = _ObjectUtil2.default.isString;

	var Stream = function () {
		function Stream(obj) {
			_classCallCheck(this, Stream);

			this.obj = obj;
		}

		_createClass(Stream, [{
			key: "forEach",
			value: function forEach(callback) {
				var obj = this.obj;

				if (isArry(obj) || isString(obj)) {
					for (var i = 0; i < obj.length; i++) {
						if (callback(i, obj[i]) === false) {
							break;
						}
					}
				} else if (isObject(obj)) {
					for (var key in obj) {
						if (callback(key, obj[key]) === false) {
							break;
						}
					}
				}
			}
		}], [{
			key: "of",
			value: function of(obj) {
				return new Stream(obj);
			}
		}]);

		return Stream;
	}();

	exports.default = Stream;
});
