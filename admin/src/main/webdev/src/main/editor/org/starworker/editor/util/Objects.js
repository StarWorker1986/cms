export default class Objects {
    static bifilter(obj, pred) {
        let t = {}, f = {};
        this.each(obj, (v, k) => {
            let branch = pred(v, k) ? t : f;
            branch[k] = v;
        });
        return { t: t, f: f };
    }

    static each(obj, fn) {
        let props = Object.keys(obj);
        for (let i = 0, len = props.length; i < len; i++) {
            let key = props[i], value = obj[key];
            fn(value, key, obj);
        }
    }

   static map(obj, fn) {
        return this.tupleMap(obj, (x, i, obj) => {
            return {
                k: i,
                v: fn(x, i, obj)
            };
        });
    }

    static tupleMap(obj, fn) {
        let r = {};
        this.each(obj, (x, i) => {
            let tuple = fn(x, i, obj);
            r[tuple.k] = tuple.v;
        });
        return r;
    }
}