class Predicate {
    static and() {
        let x = [];
        for (let _i = 0; _i < arguments.length; _i++) {
            x[_i] = arguments[_i];
        }
        
        let args = slice.call(arguments);
        return (x) => {
            for (let i = 0; i < args.length; i++) {
                if (!args[i](x)) {
                    return false;
                }
            }
            return true;
        };
    }

    static or() {
        let x = [];
        for (let _i = 0; _i < arguments.length; _i++) {
            x[_i] = arguments[_i];
        }

        let args = slice.call(arguments);
        return (x) => {
            for (let i = 0; i < args.length; i++) {
                if (args[i](x)) {
                    return true;
                }
            }
            return false;
        };
    }
}