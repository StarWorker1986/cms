import * as Fun from './Fun';
var never = Fun.never;
var always = Fun.always;

var none = function () { return NONE; };
var NONE = (function () {
    var eq = function (o) {
        return o.isNone();
    };
    // inlined from peanut, maybe a micro-optimisation?
    var call = function (thunk) { return thunk(); };
    var id = function (n) { return n; };
    var noop = function () { };
    var nul = function () { return null; };
    var undef = function () { return undefined; };
    var me = {
        fold: function (n, s) { return n(); },
        is: never,
        isSome: never,
        isNone: always,
        getOr: id,
        getOrThunk: call,
        getOrDie: function (msg) {
            throw new Error(msg || "error: getOrDie called on none.");
        },
        getOrNull: nul,
        getOrUndefined: undef,
        or: id,
        orThunk: call,
        map: none,
        ap: none,
        each: noop,
        bind: none,
        flatten: none,
        exists: never,
        forall: always,
        filter: none,
        equals: eq,
        equals_: eq,
        toArray: function () { return []; },
        toString: Fun.constant("none()")
    };
    if (Object.freeze) {
        Object.freeze(me);
    }
    return me;
})();
/** some :: a -> Option a */
var some = function (a) {
    // inlined from peanut, maybe a micro-optimisation?
    var constant_a = function () { return a; };
    var self = function () {
        // can't Fun.constant this one
        return me;
    };
    var map = function (f) {
        return some(f(a));
    };
    var bind = function (f) {
        return f(a);
    };
    var me = {
        fold: function (n, s) { return s(a); },
        is: function (v) { return a === v; },
        isSome: always,
        isNone: never,
        getOr: constant_a,
        getOrThunk: constant_a,
        getOrDie: constant_a,
        getOrNull: constant_a,
        getOrUndefined: constant_a,
        or: self,
        orThunk: self,
        map: map,
        ap: function (optfab) {
            return optfab.fold(none, function (fab) {
                return some(fab(a));
            });
        },
        each: function (f) {
            f(a);
        },
        bind: bind,
        flatten: constant_a,
        exists: bind,
        forall: bind,
        filter: function (f) {
            return f(a) ? me : NONE;
        },
        equals: function (o) {
            return o.is(a);
        },
        equals_: function (o, elementEq) {
            return o.fold(never, function (b) { return elementEq(a, b); });
        },
        toArray: function () {
            return [a];
        },
        toString: function () {
            return 'some(' + a + ')';
        }
    };
    return me;
};
/** from :: undefined|null|a -> Option a */
var from = function (value) {
    return value === null || value === undefined ? NONE : some(value);
};
export var Option = {
    some: some,
    none: none,
    from: from
};