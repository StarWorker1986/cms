(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(['exports'], factory);
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
	'use strict';

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

	var ObjectUtil = function () {
		function ObjectUtil() {
			_classCallCheck(this, ObjectUtil);
		}

		_createClass(ObjectUtil, null, [{
			key: 'join',
			value: function join(arry, separator) {
				if (arry == null || arry.length === 0) {
					return '';
				}

				for (var i = 0; i < arry.length; i++) {
					if (arry[i] == null) {
						arry.splice(i, 1);
					}
				}

				return arry.join(separator);
			}
		}, {
			key: 'formObject',
			value: function formObject(key, value, defaultValue) {
				value = value || defaultValue;

				if (key == null || value == null) {
					return null;
				}

				return { key: value };
			}
		}, {
			key: 'getIdGenerator',
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
