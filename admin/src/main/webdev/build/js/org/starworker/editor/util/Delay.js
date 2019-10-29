class Delay {
    static requestAnimationFrame(callback) {
        let requestAnimationFramePromise;
        return (() => {
            if (requestAnimationFramePromise) {
                requestAnimationFramePromise.then(callback);
                return;
            }
    
            requestAnimationFramePromise = new Promise((resolve) => {
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
        })();
    }

    static setEditorTimeout(editor, callback, time) {
        return setTimeout(() => {
            if (!editor.removed) {
                callback();
            }
        }, time);
    }

    static setEditorInterval(editor, callback, time) {
        let timer = this.setInterval(() => {
            if (!editor.removed) {
                callback();
            } 
            else {
                clearInterval(timer);
            }
        }, time);

        return timer;
    }

    static setInterval(callback, time) {
        if (typeof time !== "number") {
            time = 1; // IE 8 needs it to be > 0
        }
        return setInterval(callback, time);
    }
}