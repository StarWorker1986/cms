var typeOf = function (x) {
    if (x === null) {
        return 'null';
    }
    var t = typeof x;
    if (t === 'object' && (Array.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'Array')) {
        return 'array';
    }
    if (t === 'object' && (String.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'String')) {
        return 'string';
    }
    return t;
};
var isType = function (type) {
    return function (value) {
        return typeOf(value) === type;
    };
};
export var isString = isType('string');
export var isObject = isType('object');
export var isArray = isType('array');
export var isNull = isType('null');
export var isBoolean = isType('boolean');
export var isUndefined = isType('undefined');
export var isFunction = isType('function');
export var isNumber = isType('number');
export var isArrayOf = function (value, pred) {
    if (isArray(value)) {
        for (var i = 0, len = value.length; i < len; ++i) {
            if (pred(value[i]) !== true) {
                return false;
            }
        }
        return true;
    }
    return false;
};