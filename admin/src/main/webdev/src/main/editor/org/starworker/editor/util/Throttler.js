class FirstController {
    constructor(fn, rate) {
        this._fn = fn;
        this._rate = rate;
        this._timer = null;
    }

    cancel() {
        if (this._timer !== null) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    throttle() {
        let i, args = new Array[arguments.length];
        for (i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }

        if (this._timer === null) {
            this._timer = setTimeout(() => {
                this._fn.apply(null, args);
                this._timer = null;
            }, this._rate);
        }
    }
}

class LastController {
    constructor(fn, rate) {
        this._fn = fn;
        this._rate = rate;
        this._timer = null;
    }

    cancel() {
        if (this._timer !== null) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    throttle() {
        let i, args = new Array[arguments.length];
        for (i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }

        if (this._timer !== null) {
            clearTimeout(this._timer);
        }

        this._timer = setTimeout(() => {
            this._fn.apply(null, args);
            this._timer = null;
        }, this._rate);
    }
}

export default class Throttler {
    static first(fn, rate) {
        return new FirstController(fn, rate);
    }

    static last(fn, rate) {
        return new LastController(fn, rate);
    }
}