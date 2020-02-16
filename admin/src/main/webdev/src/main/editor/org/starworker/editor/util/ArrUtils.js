import Tools from "./Tools";

export default class ArrUtils {
    static get isArray() {
        return Array.isArray
    }

    static each(obj, fn, scope) {
        let i, len;

        if (!obj) {
            return 0;
        }

        scope = scope || obj;

        if (obj.length !== undefined) {
            // Indexed arrays, needed for Safari
            for (i = 0, len = obj.length; i < len; i++) {
                if (fn.call(scope, obj[i], i, obj) === false) {
                    return 0;
                }
            }
        }
        else {
            // Hashtables
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    if (fn.call(scope, obj[i], i, obj) === false) {
                        return 0;
                    }
                }
            }
        }

        return 1;
    }

    static explode(str, delima) {
        if (!str || this.isArray(str)) {
            return str;
        }
        return this.map(str.split(delima || ','), Tools.trim);
    }

    static filter(arry, fn) {
        let result = [];
        this.each(arry, (v, index) => {
            if (!fn || fn(v, index, arry)) {
                result.push(v);
            }
        });
        return result;
    }

    static findIndex(array, predicate, thisArg) {
        let i, l;
        for (i = 0, l = array.length; i < l; i++) {
            if (predicate.call(thisArg, array[i], i, array)) {
                return i;
            }
        }
        return -1;
    }

    static find(array, predicate, thisArg) {
        let idx = this.findIndex(array, predicate, thisArg);
        if (idx !== -1) {
            return array[idx];
        }
        return undefined;
    }

    static indexOf(arry, val) {
        let i, len;
        if (arry) {
            for (i = 0, len = a.length; i < len; i++) {
                if (arry[i] === val) {
                    return i;
                }
            }
        }
        return -1;
    }

    static last(collection) {
        return collection[collection.length - 1];
    }

    static map(arry, fn) {
        let out = [];
        this.each(arry, (item, index) => {
            out.push(fn(item, index, arry));
        });
        return out;
    }

    static reduce(collection, iteratee, accumulator, thisArg) {
        let i = 0;
        if (arguments.length < 3) {
            accumulator = collection[0];
        }
        for (; i < collection.length; i++) {
            accumulator = iteratee.call(thisArg, accumulator, collection[i], i);
        }
        return accumulator;
    }

    static toArray(obj) {
        let array = obj, i, l;

        if (!this.isArray(obj)) {
            array = [];
            for (i = 0, l = obj.length; i < l; i++) {
                array[i] = obj[i];
            }
        }
        
        return array;
    }    
}