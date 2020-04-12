import EventDispatcher from "./EventDispatcher";

export default class Observable {
    static fire(name, args, bubble) {
        let self = this;
        if (self.removed && name !== "remove" && name !== "detach") {
            return args;
        }

        args = self.__getEventDispatcher(self).fire(name, args, bubble);
        if (bubble !== false && self.parent) {
            let parent = self.parent();
            while (parent && !args.isPropagationStopped()) {
                parent.fire(name, args, false);
                parent = parent.parent();
            }
        }
        return args;
    }

    static hasEventListeners(name) {
        return this.__getEventDispatcher(this).has(name);
    }

    static on(name, callback, prepend) {
        return this.__getEventDispatcher(this).on(name, callback, prepend);
    }

    static off(name, callback) {
        return this.__getEventDispatcher(this).off(name, callback);
    }

    static once(name, callback) {
        return this.__getEventDispatcher(this).once(name, callback);
    }

    static __getEventDispatcher(obj) {
        if (!obj._eventDispatcher) {
            obj._eventDispatcher = new EventDispatcher({
                scope: obj,
                toggleEvent: (name, state) => {
                    if (EventDispatcher.isNative(name) && obj.toggleNativeEvent) {
                        obj.toggleNativeEvent(name, state);
                    }
                }
            });
        }
        return obj._eventDispatcher;
    }
}