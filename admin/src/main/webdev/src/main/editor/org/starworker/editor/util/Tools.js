import Option from "Option";

export default class Tools {
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

    static contains(e1, e2) {
        let d1 = e1.dom(), d2 = e2.dom();

        if (Env.ie) {
            return this.documentPositionContainedBy(d1, d2);
        }
        else {
            return d1 === d2 ? false : d1.contains(d2);
        }
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

    static documentPositionContainedBy(a, b) {
        return (a.compareDocumentPosition(b) & this.getOrDie("Node").DOCUMENT_POSITION_CONTAINED_BY) !== 0
    }

    static each(arry, fn) {
        for (let i = 0, len = arry.length; i < len; i++) {
            fn(arry[i], i, arry);
        }
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
            let x = arry[i];
            if (pred(x, i, arry)) {
                return Option.some(x);
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

    static foldl(xs, f, acc) {
        this.each(xs, (x) => {
            acc = f(acc, x);
        });
        return acc;
    }

    static from(x) {
        return this.isFunction(Array.from) ? Array.from(x) : Array.prototype.slice.call(x);
    }

    static getOrDie(name, scope) {
        let actual = this.resolve(name, scope);
        if (actual === undefined || actual === null) {
            throw new Error(name + " not available on this browser");
        }
        return actual;
    }

    static head(xs) {
        return xs.length === 0 ? Option.none() : Option.some(xs[0]);
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

    static indexOf(xs, x) {
        // The rawIndexOf method does not wrap up in an option. This is for performance reasons.
        var r = this.__rawIndexOf(xs, x);
        return r === -1 ? Option.none() : Option.some(r);
    };

    static last(xs) {
        return xs.length === 0 ? Option.none() : Option.some(xs[xs.length - 1]);
    }

    static lazyLookup(items) {
        let lookup;
        return (node) => {
            lookup = lookup ? lookup : this.mapToObject(items, Option.constant(true));
            return lookup.hasOwnProperty(node.nodeName.toLowerCase);
        };
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

    static resolve(p, scope) {
        return this.path(p.split('.'), scope);
    }

    static reverse(arry) {
        let copy = Array.prototype.slice.call(arry, 0);
        copy.reverse();
        return copy;
    }

    static trim(str) {
        return (str === null || str === undefined) ? '' : ('' + str).replace(/^\s*|\s*$/g, '');
    }

    static get __global() {
        return typeof window !== "undefined" ? window : Function("return this;")();
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
            fastIndex = (xs, x) => { return pIndexOf.call(xs, x); },
            slowIndex = (xs, x) => { return this.__slowIndexOf(xs, x); };
        return pIndexOf === undefined ? slowIndex : fastIndex;
    }

    static __slowIndexOf(xs, x) {
        for (let i = 0, len = xs.length; i < len; ++i) {
            if (xs[i] === x) {
                return i;
            }
        }
        return -1;
    }
}