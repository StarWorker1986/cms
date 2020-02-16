import Option from "../util/Option";

export default class Result {
    static value(o) {
        let valueO = () => this.value(o),
            valueFO = (fn) => this.value(fn(o)),
            fnO = (fn) => fn(o);

        return {
            is: (v) => o === v,
            isValue: Option.constant(true),
            isError: Option.constant(false),
            getOr: Option.constant(o),
            getOrThunk: Option.constant(o),
            getOrDie: Option.constant(o),
            or: valueO,
            orThunk: valueO,
            fold: (_, onValue) => onValue(o),
            map: valueFO,
            mapError: valueO,
            each: fnO,
            bind: fnO,
            exists: fnO,
            forall: fnO,
            toOption: () => Option.some(o)
        };
    }

    static error(msg) {
        let fnCall = (fn) => fn(),
            errorMsg = () => this.error(msg),
            errorFMsg = (fn) => this.error(fn(msg));
        return {
            is: Option.constant(false),
            isValue: Option.constant(false),
            isError: Option.constant(true),
            getOr: (opt) => opt,
            getOrThunk: fnCall,
            getOrDie: () => { throw new Error(String(msg)) },
            or: (opt) => opt,
            orThunk: fnCall,
            fold: (onError, _) => onError(msg),
            map: errorMsg,
            mapError: errorFMsg,
            each: () => {},
            bind: errorMsg,
            exists: Option.constant(false),
            forall: Option.constant(true),
            toOption: Option.none
        }
    }

    static fromOption(opt, err) {
        return opt.fold(() => this.error(err), this.value);
    }
}