import DOMUtils from "./DOMUtils";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";

export default class ScriptLoader {
    constructor() {
        this._QUEUED = 0;
        this._LOADING = 1;
        this._LOADED = 2;
        this._FAILED = 3;
        this._states = {};
        this._queue = [];
        this._scriptLoadedCallbacks = {};
        this._queueLoadedCallbacks = [];
        this._loading = 0;
    }

    loadScript(url, success, failure) {
        let dom = DOMUtils.DOM, elm, id;

        id = dom.uniqueId();
        // Create new script element
        elm = document.createElement("script");
        elm.id = id;
        elm.type = "text/javascript";
        elm.src = Tools.addCacheSuffix(url);

        elm.onload = () => {
            dom.remove(id);
            if (elm) {
                elm.onreadystatechange = elm.onload = elm = null;
            }
            success();
        };

        // Add onerror event will get fired on some browsers but not all of them
        elm.onerror = () => {
            if (Tools.isFunction(failure)) {
                failure();
            }
            else {
                throw new Error("Failed to load script: " + url);
            }
        };

        // Add script to document
        (document.getElementsByTagName("head")[0] || document.body).appendChild(elm);
    }

    isDone(url) {
        return this._states[url] === this._LOADED;
    }

    markDone(url) {
        this._states[url] = this._LOADED;
    }

    add(url, success, scope, failure) {
        let state = this._states[url];

        // Add url to load queue
        if (state === undefined) {
            this._queue.push(url);
            this._states[url] = this._QUEUED;
        }

        if (success) {
            // Store away callback for later execution
            if (!this._scriptLoadedCallbacks[url]) {
                this._scriptLoadedCallbacks[url] = [];
            }

            this._scriptLoadedCallbacks[url].push({
                success: success,
                failure: failure,
                scope: scope || this
            });
        }
    }

    remove(url) {
        delete this._states[url];
        delete this._scriptLoadedCallbacks[url];
    }

    loadQueue(success, scope, failure) {
        this.loadScripts(queue, success, scope, failure);
    }

    loadScripts(scripts, success, scope, failure) {
        this._queueLoadedCallbacks.push({
            success: success,
            failure: failure,
            scope: scope || this
        });

        this.__loadScripts(scripts);
    }

    static get scriptLoader() {
        return new ScriptLoader();
    }

    __execCallbacks(name, url) {
        // Execute URL callback functions
        ArrUtils.each(this._scriptLoadedCallbacks[url], (callback) => {
            if (Tools.isFunction(callback[name])) {
                callback[name].call(callback.scope);
            }
        });
        this._scriptLoadedCallbacks[url] = undefined;
    }

    __loadScripts(scripts) {
        let loadingScripts = ArrUtils.filter(scripts), failures = [], execCallbacks = this.__execCallbacks;

        // Current scripts has been handled
        scripts.length = 0;
        // Load scripts that needs to be loaded
        ArrUtils.each(loadingScripts, (url) => {
            // Script is already loaded then execute script callbacks directly
            if (this._states[url] === this._LOADED) {
                execCallbacks("success", url);
                return;
            }

            if (this._states[url] === this._FAILED) {
                execCallbacks("failure", url);
                return;
            }

            // Is script not loading then start loading it
            if (this._states[url] !== this._LOADING) {
                this._states[url] = this._LOADING;
                this._loading++;
                this.loadScript(url, () => {
                    this._states[url] = this._LOADED;
                    this._loading--;
                    execCallbacks("success", url);
                    // Load more scripts if they where added by the recently loaded script
                    this.__loadScripts(scripts);
                },
                () => {
                    this._states[url] = this._FAILED;
                    this._loading--;
                    failures.push(url);
                    execCallbacks("failure", url);
                    // Load more scripts if they where added by the recently loaded script
                    this.__loadScripts(script);
                });
            }
        });

        // No scripts are currently loading then execute all pending queue loaded callbacks
        if (!this._loading) {
            // We need to clone the notifications and empty the pending callbacks so that callbacks can load more resources
            let notifyCallbacks = this._queueLoadedCallbacks.slice(0);
            this._queueLoadedCallbacks.length = 0;
            ArrUtils.each(notifyCallbacks, (callback) => {
                if (failures.length === 0) {
                    if (Tools.isFunction(callback.success)) {
                        callback.success.call(callback.scope);
                    }
                }
                else {
                    if (Tools.isFunction(callback.failure)) {
                        callback.failure.call(callback.scope, failures);
                    }
                }
            });
        }
    }
}