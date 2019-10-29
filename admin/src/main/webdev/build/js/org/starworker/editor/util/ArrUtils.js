class ArrUtils {
    static get isArray() {
        return Array.isArray
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

    static each(o, cb, s) {
        let n, l;

        if (!o) {
            return 0;
        }

        s = s || o;

        if (o.length !== undefined) {
            // Indexed arrays, needed for Safari
            for (n = 0, l = o.length; n < l; n++) {
                if (cb.call(s, o[n], n, o) === false) {
                    return 0;
                }
            }
        }
        else {
            // Hashtables
            for (n in o) {
                if (o.hasOwnProperty(n)) {
                    if (cb.call(s, o[n], n, o) === false) {
                        return 0;
                    }
                }
            }
        }

        return 1;
    }

    static map(array, callback) {
        let out = [];
        this.each(array, (item, index) => {
            out.push(callback(item, index, array));
        });
        return out;
    }

    static filter(a, f) {
        let o = [];
        this.each(a, (v, index) => {
            if (!f || f(v, index, a)) {
                o.push(v);
            }
        });
        return o;
    }

    static indexOf(a, v) {
        let i, l;
        if (a) {
            for (i = 0, l = a.length; i < l; i++) {
                if (a[i] === v) {
                    return i;
                }
            }
        }
        return -1;
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

    static last(collection) {
        return collection[collection.length - 1];
    }
}