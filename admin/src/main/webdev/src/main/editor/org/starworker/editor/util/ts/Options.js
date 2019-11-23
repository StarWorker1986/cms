import { Option } from "./Option";

var cat = (arr) => {
    var r = [];
    var push = function (x) {
        r.push(x);
    };
    for (var i = 0; i < arr.length; i++) {
        arr[i].each(push);
    }
    return r;
};

var findMap = (arr, f) => {
    for (var i = 0; i < arr.length; i++) {
        var r = f(arr[i], i);
        if (r.isSome()) {
            return r;
        }
    }
    return Option.none();
};

var liftN = function (arr, f) {
    var r = [];
    for (var i = 0; i < arr.length; i++) {
        var x = arr[i];
        if (x.isSome()) {
            r.push(x.getOrDie());
        }
        else {
            return Option.none();
        }
    }
    return Option.some(f.apply(null, r));
};

function lift() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var f = args.pop();
    return liftN(args, f);
}

export { cat, findMap, liftN, lift };