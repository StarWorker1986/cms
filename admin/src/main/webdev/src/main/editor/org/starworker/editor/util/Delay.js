let requestAnimationFramePromise;

export default class Delay {
    static requestAnimationFrame(callback) {
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
    }

    static setEditorTimeout(editor, callback, time) {
        return setTimeout(() => {
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
}