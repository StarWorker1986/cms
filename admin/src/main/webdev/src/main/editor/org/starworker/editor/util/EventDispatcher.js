import Tools from "./Tools";

export default class EventDispatcher {
    constructor(settings) {
        settings = settings || {};
        this.settings = settings;
        this._scope = settings.scope || this;
        this._bindings = {};
        this._toggleEvent = settings.toggleEvent || (() => false);
    }

    fire(name, args) {
        let settings = this.settings, scope = this._scope, handlers, i, l, callback,
            returnFalse = () => false, returnTrue = () => true;
        
        name = name.toLowerCase();
        args = args || {};
        args.type = name;

        if (!args.target) {
            args.target = scope;
        }

        if (!args.preventDefault) {
            args.preventDefault = () => {
                args.isDefaultPrevented = returnTrue;
            };

            args.stopPropagation = () => {
                args.isPropagationStopped = returnTrue;
            };
            
            args.stopImmediatePropagation = () => {
                args.isImmediatePropagationStopped = returnTrue;
            };

            args.isDefaultPrevented = returnFalse;
            args.isPropagationStopped = returnFalse;
            args.isImmediatePropagationStopped = returnFalse;
        }

        if (settings.beforeFire) {
            settings.beforeFire(args);
        }

        handlers = this._bindings[name];
        if (handlers) {
            for (i = 0, l = handlers.length; i < l; i++) {
                callback = handlers[i];
                if (callback.once) {
                    this.off(name, callback.func);
                }

                if (args.isImmediatePropagationStopped()) {
                    args.stopPropagation();
                    return args;
                }

                if (callback.func.call(scope, args) === false) {
                    args.preventDefault();
                    return args;
                }
            }
        }

        return args;
    }

    has(name) {
        name = name.toLowerCase();
        return !(!this._bindings[name] || this._bindings[name].length === 0);
    }

    on(name, callback, prepend, extra) {
        let handlers, names, i;
        if (callback === false) {
            callback = () => false;
        }

        if (callback) {
            callback = {
                func: callback
            };
            if (extra) {
                Tools.extend(callback, extra);
            }

            names = name.toLowerCase().split(" ");
            i = names.length;
            while (i--) {
                name = names[i];
                handlers = this._bindings[name];
                if (!handlers) {
                    handlers = this._bindings[name] = [];
                    this._toggleEvent(name, true);
                }
                if (prepend) {
                    handlers.unshift(callback);
                }
                else {
                    handlers.push(callback);
                }
            }
        }
        return self;
    }

    off(name, callback) {
        let i, handlers, bindingName, names, hi;
        if (name) {
            names = name.toLowerCase().split(" ");
            i = names.length;
            while (i--) {
                name = names[i];
                handlers = this._bindings[name];

                if (!name) {
                    for (bindingName in this._bindings) {
                        this._toggleEvent(bindingName, false);
                        delete this._bindings[bindingName];
                    }
                    return self;
                }

                if (handlers) {
                    if (!callback) {
                        handlers.length = 0;
                    }
                    else {
                        hi = handlers.length;
                        while (hi--) {
                            if (handlers[hi].func === callback) {
                                handlers = handlers.slice(0, hi).concat(handlers.slice(hi + 1));
                                this._bindings[name] = handlers;
                            }
                        }
                    }
                    if (!handlers.length) {
                        this._toggleEvent(name, false);
                        delete this._bindings[name];
                    }
                }
            }
        }
        else {
            for (name in this._bindings) {
                this._toggleEvent(name, false);
            }
            this._bindings = {};
        }
        return self;
    }

    once(name, callback, prepend) {
        return this.on(name, callback, prepend, { once: true });
    }

    static isNative(name) {
        let nativeEvents = Tools.makeMap("focus blur focusin focusout click dblclick mousedown mouseup mousemove mouseover beforepaste paste cut copy selectionchange " +
                                         "mouseout mouseenter mouseleave wheel keydown keypress keyup input contextmenu dragstart dragend dragover " +
                                         "draggesture dragdrop drop drag submit " +
                                         "compositionstart compositionend compositionupdate touchstart touchmove touchend", " ")
        return !!nativeEvents[name.toLowerCase()];
    }
}