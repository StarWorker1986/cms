export default class Throttler {
    static first(fn, rate) {
        let timer = null;
        let cancel = () => {
            if (timer !== null) {
                clearTimeout(timer);
                timer = null;
            }
        };

        let throttle = () => {
            let args = [];
            for (let i = 0; i < arguments.length; i++) {
                args[i] = arguments[i];
            }

            if (timer === null) {
                timer = setTimeout(() => {
                    fn.apply(null, args);
                    timer = null;
                }, rate);
            }
        };

        return {
            cancel: cancel,
            throttle: throttle
        };
    }
}