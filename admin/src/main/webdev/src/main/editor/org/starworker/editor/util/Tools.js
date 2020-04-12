import Option from "./Option";
import Env from "./Env";

export default class Tools {
    static addCacheSuffix(url) {
        let cacheSuffix = new Date().getTime();
        url += (url.indexOf('?') === -1 ? '?' : '&') + cacheSuffix;
        return url;
    }

    static bind(arry, fn) {
        let output = this.map(arry, fn);
        return this.flatten(output);
    }

    static cached(fun) {
        let called = false, result;

        return () => {
            let args = [];

            for (let i = 0; i < arguments.length; i++) {
                args[i] = arguments[i];
            }

            if (!called) {
                called = true;
                result = fun.apply(null, args);
            }

            return result;
        };
    }

    static compose(fa, fb) {
        return () => {
            let args = [];
            for (let i = 0; i < arguments.length; i++) {
                args[i] = arguments[i];
            }
            return fa(fb.apply(null, args));
        };
    }

    static contains(arry, v) {
        return this.__rawIndexOf(arry, v) > -1;
    }

    static curry(fn) {
        let initialArgs = [];

        for (let i = 1; i < arguments.length; i++) {
            initialArgs[i - 1] = arguments[i];
        }

        return () => {
            let restArgs = [];
            for (let i = 0; i < arguments.length; i++) {
                restArgs[i] = arguments[i];
            }
            let all = initialArgs.concat(restArgs);
            return fn.apply(null, all);
        };
    }

    static deepMerge() {
        return this.__merge(true, arguments);
    }

    static difference(arry1, arry2) {
        return this.filter(arry1, (x) => !this.contains(arry2, x));
    }

    static each(arry, fn) {
        if(!arry || arry.length === undefined) {
            return;
        }

        for (let i = 0, len = arry.length; i < len; i++) {
            fn(arry[i], i, arry);
        }
    }

    static evaluateUntil(fns, args) {
        for (let i = 0; i < fns.length; i++) {
            let result = fns[i].apply(null, args);
            if (result.isSome()) {
                return result;
            }
        }
        return Option.none();
    }

    static exists(arry, pred) {
        return this.findIndex(arry, pred).isSome();
    }

    static extend(obj, ext) {
        let name, value, args = arguments;

        for (let i = 1, l = args.length; i < l; i++) {
            ext = args[i];
            for (name in ext) {
                if (ext.hasOwnProperty(name)) {
                    value = ext[name];
                    if (value !== undefined) {
                        obj[name] = value;
                    }
                }
            }
        }

        return obj;
    }

    static filter(arry, pred) {
        let result = [];
        for (let i = 0, len = arry.length; i < len; i++) {
            if (pred(arry[i], i, arry)) {
                result.push(arry[i]);
            }
        }
        return result;
    }

    static find(arry, pred) {
        for (let i = 0, len = arry.length; i < len; i++) {
            let v = arry[i];
            if (pred(v, i, arry)) {
                return Option.some(v);
            }
        }
        return Option.none();
    }

    static findIndex(arry, pred) {
        for (let i = 0, len = arry.length; i < len; i++) {
            let v = arry[i];
            if (pred(v, i, arry)) {
                return Option.some(i);
            }
        }
        return Option.none();
    }

    static flatten(arry) {
        let result = [], push = Array.prototype.push;

        for (let i = 0, len = arry.length; i < len; ++i) {
            if (!this.isArray(arry[i])) {
                throw new Error("Tools.flatten item " + i + " was not an array, input: " + arry);
            }
            push.apply(result, arry[i]);
        }

        return result;
    }

    static foldl(arry, f, acc) {
        this.each(arry, (v) => {
            acc = f(acc, v);
        });
        return acc;
    }

    static forall(arry, pred) {
        for (let i = 0, len = arry.length; i < len; ++i) {
            let v = arry[i];
            if (pred(v, i, arry) !== true) {
                return false;
            }
        }
        return true;
    }

    static from(v) {
        return this.isFunction(Array.from) ? Array.from(v) : Array.prototype.slice.call(v);
    }

    static get(obj, key) {
        return this.has(obj, key) ? Option.from(obj[key]) : Option.none();
    }

    static getOrDie(name, scope) {
        let actual = this.resolve(name, scope);
        if (actual === undefined || actual === null) {
            throw new Error(name + " not available on this browser");
        }
        return actual;
    }

    static generate(cases) {
        let self = this, constructors = [], adt = {};

        self.each(cases, (acase, count) => {
            let keys = Object.keys(acase), key = keys[0], value = acase[key];

            constructors.push(key);
            adt[key] = () => {
                if (arguments.length !== value.length) {
                    throw new Error("Wrong number of arguments to case " + key + ". Expected " + value.length + ' (' + value + '), Actual ' + argLength);
                }

                let args = new Array(arguments.length);
                for (let i = 0; i < args.length; i++) {
                    args[i] = arguments[i];
                }

                return {
                    fold: () => {
                        if (arguments.length !== cases.length) {
                            throw new Error("Wrong number of arguments to fold. Expected " + cases.length + ", Actual " + arguments.length);
                        }
                        let target = arguments[count];
                        return target.apply(null, args);
                    },

                    match: (branches) => {
                        let branchKeys = Object.keys(branches);
                        if (constructors.length !== branchKeys.length) {
                            throw new Error("Wrong number of arguments to match. Expected: " + constructors.join(',') + ", Actual: " + branchKeys.join(','));
                        }

                        let allReqd = self.forall(constructors, (reqKey) => self.contains(branchKeys, reqKey));
                        if (!allReqd) {
                            throw new Error("Not all branches were specified when using match. Specified: " + branchKeys.join(',') + ', Required: ' + constructors.join(','));
                        }
                        return branches[key].apply(null, args);
                    }
                };
            };
        });

        return adt;
    }

    static generateId(prefix) {
        let unique = 0;
        return () => {
            let date = new Date(), time = date.getTime(), random = Math.floor(Math.random() * 1000000000);
            unique++;
            return prefix + '_' + random + unique + String(time);
        };
    }

    static has(obj, key) {
        return hasOwnProperty.call(obj, key);
    }

    static head(arry) {
        return arry.length === 0 ? Option.none() : Option.some(arry[0]);
    }

    static isArray(value) {
        return this.__isType(value, "array");
    }

    static isFunction(value) {
        return this.__isType(value, "function");
    }

    static isString(value) {
        return this.__isType(value, "string");
    }

    static isObject(value) {
        return this.__isType(value, "object");
    }

    static isNull(value) {
        return this.__isType(value, "null");
    }

    static isUndefined(value) {
        return this.__isType(value, "undefined");
    }

    static isBoolean(value) {
        return this.__isType(value, "boolean");
    }

    static isNumber(value) {
        return this.__isType(value, "number");
    }

    static immutable() {
        let fields = [];

        for (let i = 0; i < arguments.length; i++) {
            fields[i] = arguments[i];
        }

        return () => {
            let values = [];

            for (let j = 0; j < arguments.length; j++) {
                values[j] = arguments[j];
            }

            if (fields.length !== values.length) {
                throw new Error('Wrong number of arguments to struct. Expected "[' + fields.length + ']", got ' + values.length + ' arguments');
            }

            let struct = {};
            this.each(fields, (name, k) => {
                struct[name] = Option.constant(values[k]);
            });

            return struct;
        };
    }

    static indexOf(arry, v) {
        // The rawIndexOf method does not wrap up in an option. This is for performance reasons.
        let r = this.__rawIndexOf(arry, v);
        return r === -1 ? Option.none() : Option.some(r);
    }

    static last(arry) {
        return arry.length === 0 ? Option.none() : Option.some(arry[arry.length - 1]);
    }

    static lazyLookup(items) {
        let lookup;
        return (node) => {
            lookup = lookup ? lookup : this.mapToObject(items, Option.constant(true));
            return lookup.hasOwnProperty(node.nodeName.toLowerCase);
        };
    }

    static lTrim(str) {
        return str && str.replace(/^\s+/g, '');
    }

    static makeMap(items, delim, map) {
        items = items || [];
        delim = delim || ',';
        map = map || {};

        if (typeof items === "string") {
            items = items.split(delim);
        }

        let i = items.length;
        while (i--) {
            map[items[i]] = {};
        }

        return map;
    }

    static map(arry, fn) {
        let len = arry.length, result = new Array(len);
        for (let i = 0; i < len; i++) {
            result[i] = fn(arry[i], i, arry);
        }
        return result;
    }

    static mapToObject(arry, fn) {
        let result = {};
        for (let i = 0, len = arry.length; i < len; i++) {
            result[String(arry[i])] = fn(arry[i], i);
        }
        return result;
    }

    static merge() {
        return this.__merge(false, arguments);
    }

    static modifierPressed(evt) {
        return evt.shiftKey || evt.ctrlKey || evt.altKey || this.metaKeyPressed(e);
    }

    static metaKeyPressed(evt) {
        // Check if ctrl or meta key is pressed. Edge case for AltGr on Windows where it produces ctrlKey+altKey states
        return (Env.mac ? evt.metaKey : evt.ctrlKey && !evt.altKey);
    }

    static not(fn) {
        return () => {
            let args = [];
            for (let i = 0; i < arguments.length; i++) {
                args[i] = arguments[i];
            }
            return !fn.apply(null, args);
        };
    }

    static path(parts, scope) {
        let o = scope !== undefined && scope !== null ? scope : this.__global;
        for (let i = 0; i < parts.length && o !== undefined && o !== null; ++i) {
            o = o[parts[i]];
        }
        return o;
    }

    static partition(arry, pred) {
        let pass = [], fail = [];
        for (let i = 0, len = arry.length; i < len; i++) {
            let v = arry[i], arr = pred(v, i, arry) ? pass : fail;
            arr.push(v);
        }
        return { pass: pass, fail: fail };
    }

    static resolve(p, scope) {
        return this.path(p.split('.'), scope);
    }

    static reverse(arry) {
        let copy = Array.prototype.slice.call(arry, 0);
        copy.reverse();
        return copy;
    }

    static rest(s, e) {
        let t = {};
        for (let p in s) {
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) {
                t[p] = s[p];
            }
        }

        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (let i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) {
                    t[p[i]] = s[p[i]];
                }
            }
        return t;
    }

    static rTrim(str) {
        return str && str.replace(/\s+$/g, '');
    }

    static sort(arry, comparator) {
        let copy = Array.prototype.slice.call(arry, 0);
        copy.sort(comparator);
        return copy;
    }

    static trim(str) {
        return (str === null || str === undefined) ? '' : ('' + str).replace(/^\s*|\s*$/g, '');
    }

    static toString(obj) {
        if (this.isFunction(obj)) {
            return Object.prototype.toString.call(obj);
        }

        let isEmpty = (obj === '' || obj === null || obj === undefined);
        return !isEmpty ? '' + obj : '';
    }
    
    static get __global() {
        return typeof window !== "undefined" ? window : Function("return this;")();
    }

    static __merge(isDeep, args) {
        let objects = new Array(args.length);

        for (let i = 0; i < args.length; i++) {
            objects[i] = args[i];
        }
        if (objects.length === 0) {
            throw new Error("Can't merge zero objects");
        }

        let ret = {};

        for (let j = 0; j < objects.length; j++) {
            let curObject = objects[j];
            for (let key in curObject) {
                if (hasOwnProperty.call(curObject, key)) {
                    let old = ret[key], cur = curObject[key];
                    if (isDeep) {
                        cur = this.isObject(old) && this.isObject(cur) ? this.deepMerge(old, cur) : cur;
                    }
                    ret[key] = cur;
                }
            }
        }

        return ret;
    }

    static __isType(value, targetType) {
        if (value === null) {
            return "null";
        }

        let sourceType = typeof value;
        if (sourceType === "object") {
            let constructorName = value.constructor && value.constructor.name;
            if (Array.prototype.isPrototypeOf(value) || constructorName === "Array") {
                sourceType = "array";
            }
            else if (String.prototype.isPrototypeOf(value) || constructorName === "String") {
                sourceType = "string";
            }
        }

        return sourceType === targetType;
    }

    static get __rawIndexOf() {
        let pIndexOf = Array.prototype.indexOf,
            fastIndex = (arry, v) => { return pIndexOf.call(arry, v); },
            slowIndex = (arry, v) => { return this.__slowIndexOf(arry, v); };
        return pIndexOf === undefined ? slowIndex : fastIndex;
    }

    static __slowIndexOf(arry, v) {
        for (let i = 0, len = arry.length; i < len; ++i) {
            if (arry[i] === v) {
                return i;
            }
        }
        return -1;
    }
}