export default class Option {
    static get always() {
        return this.constant(true);
    }

    static cat(arr) {
        let r = [], push = x => r.push(x);
        for (let i = 0; i < arr.length; i++) {
            arr[i].each(push);
        }
        return r;
    }

    static liftN(arr, f) {
        let r = [];
        for (let i = 0; i < arr.length; i++) {
            let x = arr[i];
            if (x.isSome()) {
                r.push(x.getOrDie());
            }
            else {
                return this.none();
            }
        }
        return this.some(f.apply(null, r));
    }

    static lift() {
        let args = [];
        for (let i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }
        let f = args.pop();
        return liftN(args, f);
    }

    static constant(value) {
        return () => {
            return value;
        };
    }

    static some(a) {
        let constant_a = this.constant(a),
            self = () => me,
            map = f => this.some(f(a)),
            bind = f => f(a),
            me = {
                fold: (n, s) => { return s(a); },
                is: (v) => { return a === v; },
                isSome: () => true,
                isNone: () => false,
                getOr: constant_a,
                getOrThunk: constant_a,
                getOrDie: constant_a,
                getOrNull: constant_a,
                getOrUndefined: constant_a,
                or: self,
                orThunk: self,
                map: map,
                ap: (optfab) => {
                    return optfab.fold(none, (fab) => {
                        return some(fab(a));
                    });
                },
                each: (f) => {
                    f(a);
                },
                bind: bind,
                flatten: constant_a,
                exists: bind,
                forall: bind,
                filter: (f) => {
                    return f(a) ? me : NONE;
                },
                equals: (o) => {
                    return o.is(a);
                },
                equals_: (o, elementEq) => {
                    return o.fold(this.never, (b) => { return elementEq(a, b); });
                },
                toArray: () => {
                    return [a];
                },
                toString: this.constant("some(" + a + ")")
            };
            
        return me;
    }

    static none() {
        let eq = o => o.isNone(),
            call = thunk => thunk(),
            id = n => n,
            noop = () => {},
            nul = () => null,
            undef = () => undefined,
            me = {
                fold: (n, s) => { return n(); },
                is: () => false,
                isSome: () => false,
                isNone: () => true,
                getOr: id,
                getOrThunk: call,
                getOrDie: (msg) => {
                    throw new Error(msg || "error: getOrDie called on none.");
                },
                getOrNull: nul,
                getOrUndefined: undef,
                or: id,
                orThunk: call,
                map: this.none,
                ap: this.none,
                each: noop,
                bind: () => this.none(),
                flatten: this.none,
                exists: this.never,
                forall: this.always,
                filter: this.none,
                equals: eq,
                equals_: eq,
                toArray: () => { return []; },
                toString: () => "none()"
            };
    
        if (Object.freeze) {
            Object.freeze(me);
        }
    
        return me;
    }

    static from(value) {
        return value === null || value === undefined ? this.none() : this.some(value);
    }

    static get never() {
        return this.constant(false);
    }
}