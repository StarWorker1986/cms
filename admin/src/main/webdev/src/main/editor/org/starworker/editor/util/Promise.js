class Handler {
    constructor(onFulfilled, onRejected, promise) {
        this.onFulfilled = typeof onFulfilled === "function" ? onFulfilled : null;
        this.onRejected = typeof onRejected === "function" ? onRejected : null;
        this.promise = promise;
    }
}

export default class Promise {
    constructor(fn) {
        if (typeof this !== "object") {
            throw new TypeError("Promises must be constructed via new");
        }
        if (typeof fn !== "function") {
            throw new TypeError("not a function");
        }

        this._state = 0;
        this._handled = false;
        this._value = undefined;
        this._deferreds = [];
        this._immediateFn = (fn) => setTimeout(fn, 0);
        this._unhandledRejectionFn = () => { };

        this.__doResolve(fn, this);
    }

    setImmediateFn(fn) {
        this._immediateFn = fn;
    }

    setUnhandledRejectionFn(fn) {
        this._unhandledRejectionFn = fn;
    }

    then(onFulfilled, onRejected) {
        let prom = new Promise(() => { });

        this.__handle(this, new Handler(onFulfilled, onRejected, prom));
        return prom;
    }

    __doResolve(fn, self) {
        let done = false;

        try {
            fn((value) => {
                if (done) {
                    return;
                }
                done = true;
                this.__resolve(self, value);
            },
                (reason) => {
                    if (done) {
                        return;
                    }
                    done = true;
                    this.__reject(self, reason);
                });
        }
        catch (ex) {
            if (done) {
                return;
            }
            done = true;
            this.__reject(self, ex);
        }
    }

    __finale(self) {
        if (self._state === 2 && self._deferreds.length === 0) {
            this._immediateFn(() => {
                if (!self._handled) {
                    this._unhandledRejectionFn(self._value);
                }
            });
        }

        for (let i = 0, len = self._deferreds.length; i < len; i++) {
            this.__handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }

    __handle(self, deferred) {
        while (self._state === 3) {
            self = self._value;
        }

        if (self._state === 0) {
            self._deferreds.push(deferred);
            return;
        }

        self._handled = true;
        this._immediateFn(() => {
            let cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;

            if (cb === null) {
                (self._state === 1 ? this.__resolve : this.__reject)(deferred.promise, self._value);
                return;
            }

            let ret;
            try {
                ret = cb(self._value);
            }
            catch (e) {
                this.__reject(deferred.promise, e);
                return;
            }
            this.__resolve(deferred.promise, ret);
        });
    }

    __resolve(self, newValue) {
        try {
            if (newValue === self) {
                throw new TypeError("A promise cannot be resolved with itself.");
            }

            if (newValue && (typeof newValue === "object" || typeof newValue === "function")) {
                let then = newValue.then;

                if (newValue instanceof Promise) {
                    self._state = 3;
                    self._value = newValue;
                    this.__finale(self);
                    return;
                }
                else if (typeof then === "function") {
                    this.__doResolve(() => then.apply(newValue, arguments), self);
                    return;
                }
            }

            self._state = 1;
            self._value = newValue;
            this.__finale(self);
        }
        catch (e) {
            this.__reject(self, e);
        }
    }

    __reject(self, newValue) {
        self._state = 2;
        self._value = newValue;
        this.__finale(self);
    }
}