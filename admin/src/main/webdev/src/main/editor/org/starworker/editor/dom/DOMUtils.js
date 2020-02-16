import Option from "../util/Option";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import PlatformDetection from "../util/PlatformDetection";
import NodeType from "./NodeType";
import EventUtils from "./EventUtils";
import Position from "./Position";
import Schema from "../html/Schema";

export default class DOMUtils {
    constructor(doc, settings) {
        this.doc = doc;

        if (!settings) {
            settings = {};
        }
        this.settings = settings;
        this._counter = 0;
        this._boundEvents = [];
        this._events = settings.ownEvents ? new EventUtils(settings.proxy) : EventUtils.Event;
        this._schema = settings.schema ? settings.schema : new Schema({});
    }

    bind(target, name, func, scope) {
        if (Tools.isArray(target)) {
            let i = target.length;
            while (i--) {
                target[i] = this.bind(target[i], name, func, scope);
            }
            return target;
        }

        // Collect all window/document events bound by editor instance
        if (this.settings.collect && (target === this.doc || target === window)) {
            this._boundEvents.push([target, name, func, scope]);
        }
        return this._events.bind(target, name, func, scope || self);
    }

    createRng() {
        return this.doc.createRange();
    }

    get(elm) {
        if (elm && this.doc && typeof elm === "string") {
            let node = this.doc.getElementById(elm);
            
            // IE and Opera returns meta elements when they match the specified input ID, but getElementsByName seems to do the trick
            if (node && node.id !== elm) {
                return this.doc.getElementsByName(elm)[1];
            }
            else {
                return node;
            }
        }

        return elm;
    }

    getContentEditable(node) {
        if (node && NodeType.isElement(node)) {
            // Check for fake content editable
            let contentEditable = node.getAttribute("data-editor-contenteditable");
            if (contentEditable && contentEditable !== "inherit") {
                return contentEditable;
            }
            // Check for real content editable
            return node.contentEditable !== "inherit" ? node.contentEditable : null;
        }
        else {
            return null;
        }
    }

    getContentEditableParent(node) {
        let root = this.getRoot(), state = null;

        for (; node && node !== root; node = node.parentNode) {
            state = this.getContentEditable(node);
            if (state !== null) {
                break;
            }
        }
        return state;
    }

    getParents(elm, selector, root, collect) {
        let result = [], selectorVal, node = this.get(elm);

        collect = collect === undefined;
        // Default root on inline mode
        root = root || (this.getRoot().nodeName !== "BODY" ? this.getRoot().parentNode : null);

        // Wrap node name as func
        if (Tools.isString(selector)) {
            selectorVal = selector;
            if (selector === '*') {
                selector = (node) => node.nodeType === 1;
            }
            else {
                selector = (node) => this.is(node, selectorVal);
            }
        }

        while (node) {
            if (node === root || !node.nodeType || node.nodeType === 9) {
                break;
            }

            if (!selector || (typeof selector === "function" && selector(node))) {
                if (collect) {
                    result.push(node);
                }
                else {
                    return [node];
                }
            }
            node = node.parentNode;
        }

        return collect ? result : null;
    }
    
    getParent(node, selector, root) {
        let parents = this.getParents(node, selector, root, false);
        return parents && parents.length > 0 ? parents[0] : null;
    }

    getPos(elm, rootElm) {
        return Position.getPos(this.doc.body, this.get(elm), rootElm);
    }

    getOuterHTML(elm) {
        let node = typeof elm === "string" ? this.get(elm) : elm;
        return NodeType.isElement(node) ? node.outerHTML : $('<div></div>').append(node.clondeNode(true)).html();
    }

    getRoot() {
        return this.settings.rootElement || this.doc.body;
    }

    is(elm, selector) {
        if (!elm) {
            return false;
        }

        // If it isn't an array then try to do some simple selectors instead of Sizzle for to boost performance
        if (!Array.isArray(elm)) {
            // Simple all selector
            if (selector === '*') {
                return elm.nodeType === 1;
            }

            let i, simpleSelectorRe = /^([a-z0-9],?)+$/i, selectors, elmName;
            
            // Simple selector just elements
            if (simpleSelectorRe.test(selector)) {
                selectors = selector.toLowerCase().split(/,/);
                elmName = elm.nodeName.toLowerCase();
                for (i = selectors.length - 1; i >= 0; i--) {
                    if (selectors[i] === elmName) {
                        return true;
                    }
                }
                return false;
            }

            // Is non element
            if (elm.nodeType && elm.nodeType !== 1) {
                return false;
            }
        }

        elm = !Array.isArray(elm) ? elm : elm[0];
        return $(selector, elm.ownerDocument || elm).length > 0;
    }

    isBlock(node) {
        let blockElementsMap = this._schema.getBlockElements();

        if (typeof node === "string") {
            return !!blockElementsMap[node];
        }
        else if (node) {
            // This function is called in module pattern style since it might be executed with the wrong this scope
            let type = node.nodeType;
            // If it's a node then check the type and use the nodeName
            if (type) {
                return !!(type === 1 && blockElementsMap[node.nodeName]);
            }
        }
        
        return false;
    }

    isChildOf(node, parent) {
        while (node) {
            if (parent === node) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    nodeIndex(node, normalized) {
        let idx = 0, lastNodeType, nodeType;

        if (node) {
            for (lastNodeType = node.nodeType, node = node.previousSibling; node; node = node.previousSibling) {
                nodeType = node.nodeType;
                if (normalized && nodeType === 3) {
                    if (nodeType === lastNodeType || !node.nodeValue.length) {
                        continue;
                    }
                }
                idx++;
                lastNodeType = nodeType;
            }
        }

        return idx;
    }

    uniqueId(prefix) {
        return (!prefix ? "editor_" : prefix) + (this._counter++);
    }

    unbind(target, name, func) {
        let i, boundEvents = this._boundEvents;

        if (Tools.isArray(target)) {
            i = target.length;
            while (i--) {
                target[i] = this.unbind(target[i], name, func);
            }
            return target;
        }

        // Remove any bound events matching the input
        if (boundEvents && (target === this.doc || target === window)) {
            i = boundEvents.length;
            while (i--) {
                var item = boundEvents[i];
                if (target === item[0] && (!name || name === item[1]) && (!func || func === item[2])) {
                    this._events.unbind(item[0], item[1], item[2]);
                }
            }
        }

        return this._events.unbind(target, name, func);
    }

    static get DOM() {
        return new DOMUtils(document);
    }

    static ancestor(scope, predicate, isRoot) {
        let el, element = scope.dom(), stop = Tools.isFunction(isRoot) ? isRoot : Option.constant(false);

        while (element.parentNode) {
            element = element.parentNode;
            el = this.fromDom(element);

            if (predicate(el)) {
                return Option.some(el);
            }
            else if (stop(el)) {
                break;
            }
        }
        return Option.none();
    }

    static after(marker, element) {
        let sibling = this.nextSibling(marker);
        sibling.fold(
            () => {
                let parent = this.parent(marker);
                parent.each((v) => {
                    this.append(v, element);
                });
            },
            (v) => {
                this.before(v, element);
            });
    }

    static append(parent, element) {
        parent.dom().appendChild(element.dom());
    }

    static before(marker, element) {
        let parent = this.parent(marker);
        parent.each((v) => {
            v.dom().insertBefore(element.dom(), marker.dom());
        });
    }

    static child(element, index) {
        let cs = element.dom().childNodes;
        return Option.from(cs[index]).map(this.fromDom);
    }

    static childNodesCount(element) {
        return element.dom().childNodes.length;
    }

    static children(element) {
        let dom = element.dom();
        return Tools.map(dom.childNodes, this.fromDom);
    }

    static contains(e1, e2) {
        let d1 = e1.dom(), d2 = e2.dom(), browser = PlatformDetection.detect().browser;
        browser.isIE() ? this.documentPositionContainedBy(d1, d2) : (d1 === d2 ? false : d1.contains(d2));
    }

    static closest(scope, selector, isRoot) {
        return this.is(scope, selector) ? Option.some(scope) : Tools.isFunction(isRoot) && isRoot(scope) ? Option.none() : this.ancestor(scope, selector, isRoot);
    }

    static documentPositionContainedBy(a, b) {
        return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0;
    }

    static documentElement(element) {
        return this.fromDom(element.dom().ownerDocument.documentElement);
    }

    static deep(orig) {
        return this.fromDom(orig.dom().cloneNode(true));
    }

    static empty(element) {
        // shortcut "empty node" trick. Requires IE 9.
        element.dom().textContent = '';
        // If the contents was a single empty text node, the above doesn't remove it. But, it's still faster in general
        // than removing every child node manually.
        // The following is (probably) safe for performance as 99.9% of the time the trick works and
        // Traverse.children will return an empty array.
        Tools.each(this.children(element), (rogue) => {
            this.remove(rogue);
        });
    }

    static findEndTagIndex(schema, html, startIndex) {
        let count = 1, index, matches, tokenRegExp, shortEndedElements;

        shortEndedElements = schema.getShortEndedElements();
        tokenRegExp = /<([!?\/])?([A-Za-z0-9\-_\:\.]+)((?:\s+[^"\">]+(?:(?:"[^"]*")|(?:\"[^\"]*\")|[^>]*))*|\/|\s+)>/g;
        tokenRegExp.lastIndex = index = startIndex;

        while ((matches = tokenRegExp.exec(html))) {
            index = tokenRegExp.lastIndex;

            if (matches[1] === '/') { // End element
                count--;
            }
            else if (!matches[1]) { // Start element
                if (matches[2] in shortEndedElements) {
                    continue;
                }
                count++;
            }

            if (count === 0) {
                break;
            }
        }

        return index;
    }

    static firstChild(element) {
        return this.child(element, 0);
    }

    static fromDom(node) {
        if (!node) {
            throw new Error("Node cannot be null or undefined");
        }
        return {
            dom: Option.constant(node)
        }
    }

    static fromElements(elements, scope) {
        let doc = scope || document, fragment = doc.createDocumentFragment();
        Tools.each(elements, (element) => {
            fragment.appendChild(element.dom());
        });
        return this.fromDom(fragment);
    }

    static fromHtml(html, scope) {
        let doc = scope || document, div = doc.createElement("div");

        div.innerHTML = html;
        if (!div.hasChildNodes() || div.childNodes.length > 1) {
            throw new Error("HTML must have a single root node");
        }
        return this.fromDom(div.childNodes[0]);
    }

    static fromTag(tag, scope) {
        let doc = scope || document, node = doc.createElement(tag);
        return this.fromDom(node);
    }

    static fromText(text, scope) {
        let doc = scope || document, node = doc.createTextNode(text);
        return this.fromDom(node);
    }

    static getAllDescendants(scope, selector) {
        let base = (scope === undefined ? document : scope.dom());
        return this.__bypassSelector(base) ? [] : ArrUtils.map(base.querySelectorAll(selector), this.fromDom);
    }

    static getCss(element, property) {
        let dom = element.dom(),
            styles = window.getComputedStyle(dom),
            r = styles.getPropertyValue(property),
            isSupported = dom.style !== undefined && Tools.isFunction(dom.style.getPropertyValue),
            v = (r === '' && (!this.__isInBody(element) ? (isSupported ? dom.style.getPropertyValue(property) : '') : r));
        return v === null ? undefined : v;
    }

    static getDescendant(scope, selector) {
        let base = (scope === undefined ? document : scope.dom());
        return this.__bypassSelector(base) ? Option.none() : Option.from(base.querySelector(selector)).map(this.fromDom);
    }

    static is(element, selector) {
        let elem = element.dom();

        if (!NodeType.isElement(elem)) {
            return false;
        }
        else if (elem.matches !== undefined) {
            return elem.matches(selector);
        }
        else if (elem.msMatchesSelector !== undefined) {
            return elem.msMatchesSelector(selector);
        }
        else if (elem.webkitMatchesSelector !== undefined) {
            return elem.webkitMatchesSelector(selector);
        }
        else if (elem.mozMatchesSelector !== undefined) {
            return elem.mozMatchesSelector(selector);
        }
        else {
            throw new Error("Browser lacks native selectors");
        }
    }

    static isRangeEq(rng1, rng2) {
        return rng1 && rng2
                    && (rng1.startContainer === rng2.startContainer && rng1.startOffset === rng2.startOffset)
                    && (rng1.endContainer === rng2.endContainer && rng1.endOffset === rng2.endOffset);
    }

    static lastChild(element) {
        return this.child(element, element.dom().childNodes.length - 1);
    }

    static nextSibling(element) {
        let dom = element.dom();
        return Option.from(dom.nextSibling).map(this.fromDom);
    }

    static nextSiblings(element) {
        let ret = [];
        do {
            ret.push(element);
            element = this.nextSibling(element);
        } while (element.isSome());
        return ret;
    }

    static name(element) {
        return element.dom().nodeName.toLowerCase();
    }

    static owner(element) {
        return this.fromDom(element.dom().ownerDocument);
    }

    static prevSibling(element) {
        let dom = element.dom();
        return Option.from(dom.previousSibling).map(this.fromDom);
    }

    static prevSiblings(element) {
        // This one needs to be reversed, so they're still in DOM order
        return this.toArray(element, prevSibling).reverse();
    }

    static parents(element, isRoot) {
        let ret = [], stop = Tools.isFunction(isRoot) ? isRoot : Option.constant(false), dom = element.dom();

        while (dom.parentNode) {
            let rawParent = dom.parentNode, p = this.fromDom(rawParent);
            ret.push(p);

            if (stop(p) === true) {
                break;
            }
            else {
                dom = rawParent;
            }
        }

        return ret;
    }

    static parent(element) {
        let dom = element.dom();
        return Option.from(dom.parentNode).map(this.fromDom);
    }

    static remove(element) {
        let dom = element.dom();
        if (dom.parentNode !== null) {
            dom.parentNode.removeChild(dom);
        }
    }

    static shallow(orig) {
        return this.fromDom(orig.dom().cloneNode(false));
    }

    static unwrap(wrapper) {
        let children = this.children(wrapper);
        if (children.length > 0) {
            this.before(wrapper, children);
        }
        this.remove(wrapper);
    }

    static toArray(target, fn) {
        let result = [];

        let recurse = (e) => {
            result.push(e);
            return fn(e);
        };

        let current = fn(target);
        do {
            current = current.bind(recurse);
        } while (current.isSome());

        return result;
    }

    static __bypassSelector(dom) {
        return !(NodeType.isElement(dom) || NodeType.isDocument(dom)) || dom.childElementCount === 0;
    }

    static __isInBody(elm) {
        let dom = NodeType.isText(elm) ? elm.dom().parentNode : elm.dom();
        return dom !== undefined && dom !== null && dom.ownerDocument.body.contains(dom);
    }
}