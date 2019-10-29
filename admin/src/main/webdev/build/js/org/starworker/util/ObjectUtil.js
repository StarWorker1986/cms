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
		global.ObjectUtil = mod.exports;
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

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
		return typeof obj;
	} : function (obj) {
		return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

	function typeOf(x) {
		if (x === null) return "null";

		var type = typeof x === "undefined" ? "undefined" : _typeof(x);

		if (type === "object" && Array.prototype.isPrototypeOf(x)) return "array";

		if (type === "object" && String.prototype.isPrototypeOf(x)) return "string";

		return type;
	}

	function isType(type) {
		return function (value) {
			return typeOf(value) === type;
		};
	}

	var ObjectUtil = function () {
		function ObjectUtil() {
			_classCallCheck(this, ObjectUtil);
		}

		_createClass(ObjectUtil, null, [{
			key: "isString",
			value: function isString(obj) {
				return isType("string")(obj);
			}
		}, {
			key: "isNumber",
			value: function isNumber(obj) {
				return isType("number")(obj);
			}
		}, {
			key: "isObject",
			value: function isObject(obj) {
				return isType("object")(obj);
			}
		}, {
			key: "isArry",
			value: function isArry(obj) {
				return isType("array")(obj);
			}
		}, {
			key: "isNull",
			value: function isNull(obj) {
				return isType("null")(obj);
			}
		}, {
			key: "isUndefined",
			value: function isUndefined(obj) {
				return isType("undefined")(obj);
			}
		}, {
			key: "isEmpty",
			value: function isEmpty(obj) {
				if (!obj) return true;

				if (ObjectUtil.isString(obj) || ObjectUtil.isArry(obj)) return obj.length == 0;

				if (ObjectUtil.isObject(obj)) {
					for (var key in obj) {
						return false;
					}
					return true;
				}
			}
		}, {
			key: "join",
			value: function join(arry, separator) {
				if (!ObjectUtil.isArry(arry) || arry.length === 0) {
					return "";
				}

				for (var i = 0; i < arry.length; i++) {
					if (arry[i] == null) {
						arry.splice(i, 1);
					}
				}

				return arry.join(separator);
			}
		}, {
			key: "formObject",
			value: function formObject(key, value, defaultValue) {
				value = value || defaultValue;

				if (key == null || value == null) {
					return null;
				}

				return { key: value };
			}
		}, {
			key: "each",
			value: function each() {}
		}, {
			key: "getIdGenerator",
			value: function getIdGenerator(prefix) {
				return function () {
					var id = 1;
					return {
						nextId: function nextId() {
							return prefix + id++;
						}
					};
				}();
			}
		}]);

		return ObjectUtil;
	}();

	exports.default = ObjectUtil;
});
