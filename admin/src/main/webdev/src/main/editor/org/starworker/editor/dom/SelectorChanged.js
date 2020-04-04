import ArrUtils from "../util/ArrUtils";
import Tools from "../util/Tools";

export default class SelectorChanged {
    constructor(dom, editor) {
        this._dom = dom;
        this._editor = editor;
        this._selectorChangedData = null;
        this._currentSelectors = null;
    }

    selectorChangedWithUnbind(selector, callback) {
        let dom = this._dom;

        if (!this._selectorChangedData) {
            this._selectorChangedData = {};
            this._currentSelectors = {};

            editor.on("NodeChange", (e) => {
                let node = e.element, parents = dom.getParents(node, null, dom.getRoot()), matchedSelectors = {};
              
                ArrUtils.each(this._selectorChangedData, (callbacks, selector) => {
                    ArrUtils.each(parents, (node) => {
                        if (dom.is(node, selector)) {
                            if (!this._currentSelectors[selector]) {
                                ArrUtils.each(callbacks, (callback) => {
                                    callback(true, { node: node, selector: selector, parents: parents });
                                });
                                this._currentSelectors[selector] = callbacks;
                            }
                            matchedSelectors[selector] = callbacks;
                            return false;
                        }
                    });
                });

                ArrUtils.each(this._currentSelectors, (callbacks, selector) => {
                    if (!matchedSelectors[selector]) {
                        delete this._currentSelectors[selector];
                        ArrUtils.each(callbacks, (callback) => {
                            callback(false, { node: node, selector: selector, parents: parents });
                        });
                    }
                });
            });
        }
        
        // Add selector listeners
        if (!this._selectorChangedData[selector]) {
            this._selectorChangedData[selector] = [];
        }
        this._selectorChangedData[selector].push(callback);

        return {
            unbind: () => {
                this.__deleteFromCallbackMap(this._selectorChangedData, selector, callback);
                this.__deleteFromCallbackMap(this._currentSelectors, selector, callback);
            }
        };
    }

    __deleteFromCallbackMap(callbackMap, selector, callback) {
        if (callbackMap && callbackMap.hasOwnProperty(selector)) {
            let newCallbacks = Tools.filter(callbackMap[selector], (cb) => cb !== callback);
            if (newCallbacks.length === 0) {
                delete callbackMap[selector];
            }
            else {
                callbackMap[selector] = newCallbacks;
            }
        }
    }
}