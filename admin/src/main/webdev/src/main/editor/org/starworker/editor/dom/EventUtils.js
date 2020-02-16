import Env from "../Env";

export default class EventUtils {
    constructor() {
        this._domLoaded = false;
        this._events = {};
        this._count = 1;
        this._expando = "editor-data-" + (+new Date()).toString(32);
    }

    bind(target, names, callback, scope) {
        let id, callbackList, i, name, fakeName, nativeHandler, capture, win = window, expando = this._expando,
            hasFocusIn = "onfocusin" in document.documentElement;
            hasMouseEnterLeave = "onmouseenter" in document.documentElement,
            mouseEnterLeave = { mouseenter: "mouseover", mouseleave: "mouseout" };
        
        // Don"t bind to text nodes or comments
        if (!target || target.nodeType === 3 || target.nodeType === 8) {
            return;
        }

        // Create or get events id for the target
        if (!target[expando]) {
            id = this._count++;
            target[expando] = id;
            this._events[id] = {};
        }
        else {
            id = target[expando];
        }

        // Setup the specified scope or use the target as a default
        scope = scope || target;
        // Split names and bind each event, enables you to bind multiple events with one call
        names = names.split(' ');
        i = names.length;
        while (i--) {
            name = names[i];
            nativeHandler = (evt) => this.__executeHandlers(this.__fix(evt || win.event), id);
            fakeName = capture = false;

            // Use ready instead of DOMContentLoaded
            if (name === "DOMContentLoaded") {
                name = "ready";
            }

            // DOM is already ready
            if (this._domLoaded && name === "ready" && target.readyState === "complete") {
                callback.call(scope, this.__fix({ type: name }));
                continue;
            }

            // Handle mouseenter/mouseleaver
            if (!hasMouseEnterLeave) {
                fakeName = mouseEnterLeave[name];
                if (fakeName) {
                    nativeHandler = (evt) => {
                        let current = evt.currentTarget, related = evt.relatedTarget;

                        // Check if related is inside the current target if it"s not then the event should
                        // be ignored since it"s a mouseover/mouseout inside the element
                        if (related && current.contains) {
                            // Use contains for performance
                            related = current.contains(related);
                        }
                        else {
                            while (related && related !== current) {
                                related = related.parentNode;
                            }
                        }
                        // Fire fake event
                        if (!related) {
                            evt = this.__fix(evt || win.event);
                            evt.type = evt.type === "mouseout" ? "mouseleave" : "mouseenter";
                            evt.target = current;
                            this.__executeHandlers(evt, id);
                        }
                    };
                }
            }

            // Fake bubbling of focusin/focusout
            if (!hasFocusIn && (name === "focusin" || name === "focusout")) {
                capture = true;
                fakeName = name === "focusin" ? "focus" : "blur";
                nativeHandler = (evt) => {
                    evt = this.__fix(evt || win.event);
                    evt.type = evt.type === "focus" ? "focusin" : "focusout";
                    this.__executeHandlers(evt, id);
                };
            }

            // Setup callback list and bind native event
            callbackList = this._events[id][name];
            if (!callbackList) {
                this._events[id][name] = callbackList = [{ func: callback, scope: scope }];
                callbackList.fakeName = fakeName;
                callbackList.capture = capture;
                // callbackList.callback = callback;
                // Add the nativeHandler to the callback list so that we can later unbind it
                callbackList.nativeHandler = nativeHandler;

                // Check if the target has native events support
                if (name === "ready") {
                    this.__bindOnReady(target, nativeHandler);
                }
                else {
                    this.__addEvent(target, fakeName || name, nativeHandler, capture);
                }
            }
            else {
                if (name === "ready" && this._domLoaded) {
                    callback({ type: name });
                }
                else {
                    // If it already has an native handler then just push the callback
                    callbackList.push({ func: callback, scope: scope });
                }
            }
        }
        target = callbackList = 0; // Clean memory for IE

        return callback;
    }

    unbind(target, names, callback) {
        let id, callbackList, i, ci, name, eventMap, expando = this._expando;

        // Don"t bind to text nodes or comments
        if (!target || target.nodeType === 3 || target.nodeType === 8 || !target[expando]) {
            return this;
        }

        // Unbind event or events if the target has the expando
        id = target[expando];
        eventMap = this._events[id];

        // Specific callback
        if (names) {
            names = names.split(' ');
            i = names.length;
            while (i--) {
                name = names[i];
                callbackList = eventMap[name];
                if(!callbackList) {
                    continue;
                }

                // Remove specified callback
                if (callback) {
                    ci = callbackList.length;
                    while (ci--) {
                        if (callbackList[ci].func === callback) {
                            let nativeHandler = callbackList.nativeHandler,
                                fakeName = callbackList.fakeName,
                                capture = callbackList.capture;

                            // Clone callbackList since unbind inside a callback would otherwise break the handlers loop
                            callbackList = callbackList.slice(0, ci).concat(callbackList.slice(ci + 1));
                            callbackList.nativeHandler = nativeHandler;
                            callbackList.fakeName = fakeName;
                            callbackList.capture = capture;
                            eventMap[name] = callbackList;
                        }
                    }
                }

                // Remove all callbacks if there isn"t a specified callback or there is no callbacks left
                if (!callback || callbackList.length === 0) {
                    delete eventMap[name];
                    this.__removeEvent(target, callbackList.fakeName || name, callbackList.nativeHandler, callbackList.capture);
                }
            }
        }
        else {
            // All events for a specific element
            for (name in eventMap) {
                callbackList = eventMap[name];
                this.__removeEvent(target, callbackList.fakeName || name, callbackList.nativeHandler, callbackList.capture);
            }
            eventMap = {};
        }

        // Check if object is empty, if it isn"t then we won"t remove the expando map
        for (name in eventMap) {
            return this;
        }

        // Delete event object
        delete this._events[id];

        // Remove expando from target
        try {
            // IE will fail here since it can"t delete properties from window
            delete target[expando];
        }
        catch (ex) {
            // IE will set it to null
            target[expando] = null;
        }

        return this;
    }

    fire(target, name, args) {
        // Don"t bind to text nodes or comments
        if (!target || target.nodeType === 3 || target.nodeType === 8) {
            return this;
        }

        // Build event object by patching the args
        args = this.__fix(null, args);
        args.type = name;
        args.target = target;

        let id, expando = this._expando;
        do {
            // Found an expando that means there is listeners to execute
            id = target[expando];
            if (id) {
                this.__executeHandlers(args, id);
            }
            // Walk up the DOM
            target = target.parentNode || target.ownerDocument || target.defaultView || target.parentWindow;
        } while (target && !args.isPropagationStopped());

        return this;
    }
    
    clean(target) {
        // Don"t bind to text nodes or comments
        if (!target || target.nodeType === 3 || target.nodeType === 8) {
            return this;
        }

        let expando = this._expando
        // Unbind any element on the specified target
        if (target[expando]) {
            this.unbind(target);
        }
        
        // Target doesn"t have getElementsByTagName it"s probably a window object then use it"s document to find the children
        if (!target.getElementsByTagName) {
            target = target.document;
        }

        let i, children;
        // Remove events from each child element
        if (target && target.getElementsByTagName) {
            this.unbind(target);
            children = target.getElementsByTagName('*');
            i = children.length;

            while (i--) {
                target = children[i];
                if (target[expando]) {
                    this.unbind(target);
                }
            }
        }

        return this;
    }

    destroy() {
        this._events = {};
    }

    // Legacy function for canceling events
    cancel(e) {
        if (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
        return false;
    }

    static get Event() {
        return new EventUtils();
    }

    __addEvent(target, name, callback, capture) {
        if (target.addEventListener) {
            target.addEventListener(name, callback, capture || false);
        }
        else if (target.attachEvent) {
            target.attachEvent("on" + name, callback);
        }
    }

    __removeEvent(target, name, callback, capture) {
        if (target.removeEventListener) {
            target.removeEventListener(name, callback, capture || false);
        }
        else if (target.detachEvent) {
            target.detachEvent("on" + name, callback);
        }
    }

    __bindOnReady(win, callback) {
        let doc = win.document, event = { type: "ready" }, isDocReady, readyHandler, waitForDomLoaded, tryScroll;

        if (this._domLoaded) {
            callback(event);
            return;
        }

        isDocReady = () => doc.readyState === "complete" || (doc.readyState === "interactive" && doc.body);

        // Gets called when the DOM is ready
        readyHandler = () => {
            this.__removeEvent(win, "DOMContentLoaded", readyHandler);
            this.__removeEvent(win, "load", readyHandler);
            if (!this._domLoaded) {
                this._domLoaded = true;
                callback(event);
            }
        };

        waitForDomLoaded = () => {
            if (isDocReady()) {
                this.__removeEvent(doc, "readystatechange", waitForDomLoaded);
                readyHandler();
            }
        };

        tryScroll = () => {
            try {
                // If IE is used, use the trick by Diego Perini licensed under MIT by request to the author.
                // http://javascript.nwbox.com/IEContentLoaded/
                doc.documentElement.doScroll("left");
            }
            catch (ex) {
                setTimeout(tryScroll, 0);
                return;
            }
            readyHandler();
        };

        // Use W3C method (exclude IE 9,10 - readyState "interactive" became valid only in IE 11)
        if (doc.addEventListener && !(Env.ie && Env.ie < 11)) {
            if (isDocReady()) {
                readyHandler();
            }
            else {
                this.__addEvent(win, "DOMContentLoaded", readyHandler);
            }
        }
        else {
            // Use IE method
            this.__addEvent(doc, "readystatechange", waitForDomLoaded);
            // Wait until we can scroll, when we can the DOM is initialized
            if (doc.documentElement.doScroll && win.self === win.top) {
                tryScroll();
            }
        }

        // Fallback if any of the above methods should fail for some odd reason
        this.__addEvent(win, "load", readyHandler);
    }

    __fix = function (originalEvent, data) {
        let name, event = data || {}, mouseEventRe = /^(?:mouse|contextmenu)|click/,
            hasIsDefaultPrevented, returnTrue, returnFalse;
        let deprecated = {
            keyLocation: 1, layerX: 1, layerY: 1, returnValue: 1,
            webkitMovementX: 1, webkitMovementY: 1, keyIdentifier: 1
        };

        returnTrue = () => true;
        returnFalse = () => false;

        // Copy all properties from the original event
        for (name in originalEvent) {
            // layerX/layerY is deprecated in Chrome and produces a warning
            if (!deprecated[name]) {
                event[name] = originalEvent[name];
            }
        }

        // Normalize target IE uses srcElement
        if (!event.target) {
            event.target = event.srcElement || document;
        }

        // Experimental shadow dom support
        if (Env.experimentalShadowDom) {
            event.target = this.__getTargetFromShadowDom(originalEvent, event.target);
        }

        // Calculate pageX/Y if missing and clientX/Y available
        if (originalEvent && mouseEventRe.test(originalEvent.type)
                          && originalEvent.pageX === undefined
                          && originalEvent.clientX !== undefined) {
            let eventDoc = event.target.ownerDocument || document,
                doc = eventDoc.documentElement, body = eventDoc.body;
            
            event.pageX = originalEvent.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0)
                                                - (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = originalEvent.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0)
                                                - (doc && doc.clientTop || body && body.clientTop || 0);
        }

        // Add preventDefault method
        event.preventDefault = () => {
            event.isDefaultPrevented = returnTrue;
            // Execute preventDefault on the original event object
            if (originalEvent) {
                if (originalEvent.preventDefault) {
                    originalEvent.preventDefault();
                }
                else {
                    originalEvent.returnValue = false; // IE
                }
            }
        };

        // Add stopPropagation
        event.stopPropagation = () => {
            event.isPropagationStopped = returnTrue;
            // Execute stopPropagation on the original event object
            if (originalEvent) {
                if (originalEvent.stopPropagation) {
                    originalEvent.stopPropagation();
                }
                else {
                    originalEvent.cancelBubble = true; // IE
                }
            }
        };

        // Add stopImmediatePropagation
        event.stopImmediatePropagation = () => {
            event.isImmediatePropagationStopped = returnTrue;
            event.stopPropagation();
        };

        hasIsDefaultPrevented = event.isDefaultPrevented === returnTrue || event.isDefaultPrevented === returnFalse;
        // Add event delegation states
        if (hasIsDefaultPrevented === false) {
            event.isDefaultPrevented = returnFalse;
            event.isPropagationStopped = returnFalse;
            event.isImmediatePropagationStopped = returnFalse;
        }
        
        // Add missing metaKey for IE 8
        if (typeof event.metaKey === "undefined") {
            event.metaKey = false;
        }

        return event;
    }

    __executeHandlers(evt, id) {
        let callbackList, i, l, callback, container = this._events[id];

        callbackList = container && container[evt.type];
        if (callbackList) {
            for (i = 0, l = callbackList.length; i < l; i++) {
                callback = callbackList[i];

                // Check if callback exists might be removed if a unbind is called inside the callback
                if (callback && callback.func.call(callback.scope, evt) === false) {
                    evt.preventDefault();
                }

                // Should we stop propagation to immediate listeners
                if (evt.isImmediatePropagationStopped()) {
                    return;
                }
            }
        }
    }

    __getTargetFromShadowDom(event, defaultTarget) {
        // When target element is inside Shadow DOM we need to take first element from composedPath
        // otherwise we"ll get Shadow Root parent, not actual target element
        if (event.composedPath) {
            let composedPath = event.composedPath();
            if (composedPath && composedPath.length > 0) {
                return composedPath[0];
            }
        }
        return defaultTarget;
    }
}

EventUtils.Event.bind(window, "ready", function () { });