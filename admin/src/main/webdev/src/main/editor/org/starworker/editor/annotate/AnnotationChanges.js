import Throttler from "../util/Throttler";
import Option from "../util/Option";
import Tools from "../util/Tools";
import Identification from "./Identification";

export default class AnnotationChanges {
    static setup(editor, registry) {
        let changeCallbacks = new Cell({}),
            onNodeChange = Throttler.last(() => this.__onNodeChange(changeCallbacks), 30);

        editor.on("remove", () => {
            onNodeChange.cancel();
        });

        editor.on("nodeChange", () => {
            onNodeChange.throttle();
        })

        return {
            addListener: (name, fn) => this.__addListener(name, fn, changeCallbacks)
        };
    }

    static __addListener(name, fn, changeCallbacks) {
        this.__updateCallbacks(name, (data) => {
            return {
                previous: data.previous,
                listeners: data.listeners.concat([fn])
            };
        }, changeCallbacks);
    }

    static __fireCallbacks(name, uid, elements, changeCallbacks) {
        this.__withCallbacks(name, (data) => {
            Tools.each(data.listeners, (fn) => fn(true, name, {
                uid: uid,
                nodes: Tools.map(elements, (elm) => elm.dom())
            }));
        }, changeCallbacks);
    }

    static __fireNoAnnotation(name, changeCallbacks) {
        this.__withCallbacks(name, (data) => {
            Tools.each(data.listeners, (fn) => fn(false, name));
        }, changeCallbacks);
    }

    static __initData() {
        return ({
            listeners: [],
            previous: new Cell(Option.none())
        });
    }

    static __onNodeChange(changeCallbacks) {
        let callbackMap = changeCallbacks.get(), annotations = Tools.sort(Object.keys(callbackMap));
        Tools.each(annotations, (name) => {
            this.__updateCallbacks(name, (data) => {
                let prev = data.previous.get();
                Identification.identify(editor, Option.some(name)).fold(() => {
                    if (prev.isSome()) {
                        // Changed from something to nothing.
                        this.__fireNoAnnotation(name, changeCallbacks);
                        data.previous.set(Option.none());
                    }
                },
                (a) => {
                    let uid = a.uid, name = a.name, elements = a.elements;
                    // Changed from a different annotation (or nothing)
                    if (!prev.is(uid)) {
                        this.__fireCallbacks(name, uid, elements, changeCallbacks);
                        data.previous.set(Option.some(uid));
                    }
                });
                return {
                    previous: data.previous,
                    listeners: data.listeners
                };
            }, changeCallbacks);
        });
    }

    static __updateCallbacks(name, fn, changeCallbacks) {
        let callbackMap = changeCallbacks.get(),
            data = callbackMap.hasOwnProperty(name) ? callbackMap[name] : this.__initData(),
            outputData = fn(data);
        callbackMap[name] = outputData;
        changeCallbacks.set(callbackMap);
    }

    static __withCallbacks(name, fn, changeCallbacks) {
        this.__updateCallbacks(name, (data) => {
            fn(data);
            return data;
        }, changeCallbacks);
    }
}