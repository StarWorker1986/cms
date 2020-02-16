class Controller {
    constructor(callback, time) {
        this._timer = null;
        this._callback = callback;
        this._time = time;
    }

    start() {
        let i, args = new Array[arguments.length];
        for (i = 0; i < arguments.length; i++) {
            args[i] = arguments[i];
        }

        if(this._timer != null) {
            clearTimeout(this._timer);
        }
        this._timer = Delay.wrappedSetTimeout(() => this._callback.apply(this, args), this._time);
    }

    stop() {
        if(this._timer != null) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }
}

export default class Delay {
    static debounce(callback, time) {
        new Controller(callback, time);
    }

    static requestAnimationFrame(callback) {
        if (Delay.requestAnimationFramePromise) {
            Delay.requestAnimationFramePromise.then(callback);
            return;
        }

        Delay.requestAnimationFramePromise = new Promise((resolve) => {
            let requestAnimationFrameFunc = window.requestAnimationFrame, vendors = ["ms", "moz", "webkit"];

            for (let i = 0; i < vendors.length && !requestAnimationFrameFunc; i++) {
                requestAnimationFrameFunc = window[vendors[i] + "RequestAnimationFrame"];
            }
            if (!requestAnimationFrameFunc) {
                setTimeout(resolve, 0);
            }
            else {
                requestAnimationFrameFunc(resolve);
            }           
        }).then(callback);
    }

    static setEditorTimeout(editor, callback, time) {
        return this.wrappedSetTimeout(() => {
            if (!editor.removed) {
                callback();
            }
        }, time);
    }

    static setEditorInterval(editor, callback, time) {
        let timer = setInterval(() => {
            if (!editor.removed) {
                callback();
            } 
            else {
                clearInterval(timer);
            }
        }, time);

        return timer;
    }

    static throttle(callback, time) {
        return new Controller(callback, time);
    }

    static wrappedSetTimeout(callback, time) {
        if (typeof time !== "number") {
            time = 0;
        }
        return setTimeout(callback, time);
    }
}