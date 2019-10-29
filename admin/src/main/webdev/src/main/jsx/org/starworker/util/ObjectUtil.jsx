function typeOf(x) {
	if (x === null)
		return "null";

	let type = typeof x;

	if (type === "object" && Array.prototype.isPrototypeOf(x))
		return "array";

	if (type === "object" && String.prototype.isPrototypeOf(x))
		return "string";

	return type;
}

function isType(type) {
	return function (value) {
		return typeOf(value) === type;
	}
}

export default class ObjectUtil {
	static isString(obj) {
		return isType("string")(obj);
	}

	static isNumber(obj) {
		return isType("number")(obj);
	}
	
	static isObject(obj) {
		return isType("object")(obj);
	}

	static isArry(obj) {
		return isType("array")(obj);
	}

	static isNull(obj) {
		return isType("null")(obj);
	}

	static isUndefined(obj) {
		return isType("undefined")(obj);
	}

	static isEmpty(obj) {
		if(!obj) return true;

		if(ObjectUtil.isString(obj) || ObjectUtil.isArry(obj)) return obj.length == 0;

		if(ObjectUtil.isObject(obj)) {
			for(let key in obj) {
				return false;
			}
			return true;
		}
	}

	static join(arry, separator) {
		if (!ObjectUtil.isArry(arry) || arry.length === 0) {
			return "";
		}

		for (let i = 0; i < arry.length; i++) {
			if (arry[i] == null) {
				arry.splice(i, 1);
			}
		}

		return arry.join(separator);
	}

	static formObject(key, value, defaultValue) {
		value = value || defaultValue;

		if (key == null || value == null) {
			return null;
		}

		return { key: value };
	}

	static each() {

	}

	static getIdGenerator(prefix) {
		return (function () {
			var id = 1;
			return {
				nextId: function () {
					return prefix + id++;
				}
			}
		})();
	}
}