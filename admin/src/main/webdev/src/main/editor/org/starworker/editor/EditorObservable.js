import Observable from "./util/Observable";
import DOMUtils from "./dom/DOMUtils";
import Tools from "./util/Tools";
import ArrUtils from "./util/ArrUtils";
import Mode from "./Mode";

export default class EditorObservable {
    static bindPendingEventDelegates() {
        let self = this;
        ArrUtils.each(self._pendingNativeEvents, (name) => {
            self.__bindEventDelegate(self, name);
        });
    }

    static toggleNativeEvent(name, state) {
        let self = this;
        if (name === "focus" || name === "blur") {
            return;
        }

        if (state) {
            if (self.initialized) {
                self.__bindEventDelegate(self, name);
            }
            else {
                if (!self._pendingNativeEvents) {
                    self._pendingNativeEvents = [name];
                }
                else {
                    self._pendingNativeEvents.push(name);
                }
            }
        }
        else if (self.initialized) {
            self.dom.unbind(self.__getEventTarget(self, name), name, self.delegates[name]);
            delete self.delegates[name];
        }
    }

    static unbindAllNativeEvents() {
        let self = this, body = self.getBody(), dom = self.dom, name;

        if (self.delegates) {
            for (name in self.delegates) {
                self.dom.unbind(this.__getEventTarget(self, name), name, self.delegates[name]);
            }
            delete self.delegates;
        }

        if (!self.inline && body && dom) {
            body.onload = null;
            dom.unbind(self.getWin());
            dom.unbind(self.getDoc());
        }

        if (dom) {
            dom.unbind(body);
            dom.unbind(self.getContainer());
        }
    }

    static __bindEventDelegate(editor, eventName) {
        let eventRootElm, delegate, DOM = DOMUtils.DOM,
            customEventRootDelegates = EditorObservable.customEventRootDelegates;

        if (!editor.delegates) {
            editor.delegates = {};
        }
        if (editor.delegates[eventName] || editor.removed) {
            return;
        }

        eventRootElm = this.__getEventTarget(editor, eventName);
        if (editor.settings.eventRoot) {
            if (!customEventRootDelegates) {
                customEventRootDelegates = {};
                editor.editorManager.on("removeEditor", () => {
                    let name;
                    if (!editor.editorManager.activeEditor) {
                        if (customEventRootDelegates) {
                            for (name in customEventRootDelegates) {
                                editor.dom.unbind(this.__getEventTarget(editor, name));
                            }
                            customEventRootDelegates = null;
                        }
                    }
                });
            }

            if (customEventRootDelegates[eventName]) {
                return;
            }

            delegate = (e) => {
                let target = e.target, editors = editor.editorManager.get(), i = editors.length;
                while (i--) {
                    let body = editors[i].getBody();
                    if (body === target || DOM.isChildOf(target, body)) {
                        this.__fireEvent(editors[i], eventName, e);
                    }
                }
            };
            customEventRootDelegates[eventName] = delegate;
            DOM.bind(eventRootElm, eventName, delegate);
        }
        else {
            delegate = (e) => {
                this.__fireEvent(editor, eventName, e);
            };
            DOM.bind(eventRootElm, eventName, delegate);
            editor.delegates[eventName] = delegate;
        }
    }

    static __fireEvent(editor, eventName, e) {
        if (!editor.hidden && !editor.readonly) {
            editor.fire(eventName, e);
        }
        else if (Mode.isReadOnly(editor)) {
            e.preventDefault();
        }
    }

    static __getEventTarget(editor, eventName) {
        if (eventName === "selectionchange") {
            return editor.getDoc();
        }

        if (!editor.inline && /^mouse|touch|click|contextmenu|drop|dragover|dragend/.test(eventName)) {
            return editor.getDoc().documentElement;
        }

        if (editor.settings.eventRoot) {
            if (!editor.eventRoot) {
                editor.eventRoot = DOMUtils.DOM.select(editor.settings.eventRoot)[0];
            }
            return editor.eventRoot;
        }
        return editor.getBody();
    }
}
EditorObservable.customEventRootDelegates = null;
EditorObservable = Tools.extend({}, Observable, EditorObservable);