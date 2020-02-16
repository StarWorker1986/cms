export default class Objects {
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

    /** tupleMap :: (JsObj(k, v), (v, k, JsObj(k, v) -> { k: x, v: y })) -> JsObj(x, y) */
    static tupleMap(obj, fn) {
        let r = {};
        this.each(obj, (x, i) => {
            let tuple = fn(x, i, obj);
            r[tuple.k] = tuple.v;
        });
        return r;
    }
}