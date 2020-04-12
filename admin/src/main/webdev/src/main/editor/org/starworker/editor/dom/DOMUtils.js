import Env from "../util/Env";
import Option from "../util/Option";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import PlatformDetection from "../util/PlatformDetection";
import NodeType from "./NodeType";
import EventUtils from "./EventUtils";
import TrimNode from "./TrimNode";
import Position from "./Position";
import Schema from "../html/Schema";
import Styles from "../html/Styles";
import TreeWalker from "./TreeWalker";

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
        this._addedStyles = {};
        this._styles = new Styles({
            urlConverter: settings.urlConverter,
            urlConverterScope: settings.urlConverterScope
        }, settings.schema);
    }

    add(parentElm, name, attrs, html, create) {
        return this.run(parentElm, (parentElm) => {
            let newElm = (typeof name === "string" ? this.doc.createElement(name) : name);
            this.setAttribs(newElm, attrs);
            if (html) {
                if (typeof html !== "string" && html.nodeType) {
                    newElm.appendChild(html);
                }
                else if (typeof html === "string") {
                    this.setHTML(newElm, html);
                }
            }
            return !create ? parentElm.appendChild(newElm) : newElm;
        });
    }

    addClass(elm, cls) {
        $(elm).addClass(cls);
    }

    addStyle(cssText) {
        let head, styleElm, doc = this.doc;

        if (self !== DOMUtils.DOM && doc === document) {
            if (this._addedStyles[cssText]) {
                return;
            }
            this._addedStyles[cssText] = true;
        }

        // Create style element if needed
        styleElm = doc.getElementById("editorDefaultStyles");
        if (!styleElm) {
            styleElm = doc.createElement("style");
            styleElm.id = "editorDefaultStyles";
            styleElm.type = "text/css";
            
            head = doc.getElementsByTagName("head")[0];
            if (head.firstChild) {
                head.insertBefore(styleElm, head.firstChild);
            }
            else {
                head.appendChild(styleElm);
            }
        }

        // Append style data to old or new style element
        if (styleElm.styleSheet) {
            styleElm.styleSheet.cssText += cssText;
        }
        else {
            styleElm.appendChild(doc.createTextNode(cssText));
        }
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

    clone(node, deep) {
        if (!Env.ie || node.nodeType !== 1 || deep) {
            return node.cloneNode(deep);
        }

        // Make a HTML5 safe shallow copy
        if (!deep) {
            let clone = this.doc.createElement(node.nodeName);
            ArrUtils.each(this.getAttribs(node), (attr) => {
                this.setAttrib(clone, attr.nodeName, this.getAttrib(node, attr.nodeName));
            });
            return clone;
        }
        return null;
    }

    create(name, attrs, html) {
        return $(this.doc.createElement(name)).attr(attrs).html(html)[0];
    }

    createFragment(html) {
        let doc = this.doc, node, container = doc.createElement("div"), frag = doc.createDocumentFragment();
        if (html) {
            container.innerHTML = html;
        }
        while ((node = container.firstChild)) {
            frag.appendChild(node);
        }
        return frag;
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

    getAttrib(elm, name) {
        return $(elm).attr(name);
    }

    getAttribs(elm) {
        let node = this.get(elm);
        if (!node) {
            return [];
        }
        return node.attributes;
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

    getStyle(elm, name, computed) {
        let $elm = $(elm);
        if (computed) {
            return $elm.css(name);
        }

        // Camelcase it, if needed
        name = name.replace(/-(\D)/g, (a, b) => {
            return b.toUpperCase();
        });

        if (name === "float") {
            name = Env.ie && Env.ie < 12 ? "styleFloat" : "cssFloat";
        }
        return $elm[0] && $elm[0].style ? $elm[0].style[name] : undefined;
    }

    hasClass(elm, cls) {
        return $(elm).hasClass(cls);
    }

    insertAfter(node, reference) {
        let referenceNode = this.get(reference);
        return this.run(node, (node) => {
            let parent, nextSibling;
            parent = referenceNode.parentNode;
            nextSibling = referenceNode.nextSibling;
            if (nextSibling) {
                parent.insertBefore(node, nextSibling);
            }
            else {
                parent.appendChild(node);
            }
            return node;
        });
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

    isEmpty(node, elements) {
        let i, attributes, type, whitespace, walker, name, brCount = 0, bogusVal, whiteSpaceRegExp = /^[ \t\r\n]*$/;
        
        node = node.firstChild;
        if (node) {
            walker = new TreeWalker(node, node.parentNode);
            elements = elements || (this._schema ? this._schema.getNonEmptyElements() : null);
            whitespace = this._schema ? this._schema.getWhiteSpaceElements() : {};

            do {
                type = node.nodeType;
                if (NodeType.isElement(node)) {
                    bogusVal = node.getAttribute("data-editor-bogus");
                    if (bogusVal) {
                        node = walker.next(bogusVal === "all");
                        continue;
                    }

                    // Keep empty elements like <img />
                    name = node.nodeName.toLowerCase();
                    if (elements && elements[name]) {
                        // Ignore single BR elements in blocks like <p><br /></p> or <p><span><br /></span></p>
                        if (name === "br") {
                            brCount++;
                            node = walker.next();
                            continue;
                        }
                        return false;
                    }

                    // Keep elements with data-bookmark attributes or name attribute like <a name="1"></a>
                    attributes = this.getAttribs(node);
                    i = attributes.length;
                    while (i--) {
                        name = attributes[i].nodeName;
                        if (name === "name" || name === "data-editor-bookmark") {
                            return false;
                        }
                    }
                }

                // Keep comment nodes
                if (type === 8) {
                    return false;
                }

                // Keep non whitespace text nodes
                if (type === 3 && !whiteSpaceRegExp.test(node.nodeValue)) {
                    return false;
                }
                
                // Keep whitespace preserve elements
                if (type === 3 && node.parentNode && whitespace[node.parentNode.nodeName] && whiteSpaceRegExp.test(node.nodeValue)) {
                    return false;
                }
                node = walker.next();
            } while (node);
        }

        return brCount <= 1;
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

    parseStyle(cssText) {
        return this._styles.parse(cssText);
    }

    remove(node, keepChildren) {
        let $node = $(node);

        if (keepChildren) {
            $node.each(function() {
                let child;
                while ((child = this.firstChild)) {
                    if (child.nodeType === 3 && child.data.length === 0) {
                        this.removeChild(child);
                    }
                    else {
                        this.parentNode.insertBefore(child, this);
                    }
                }
            }).remove();
        }
        else {
            $node.remove();
        }
        return $node.length > 1 ? $node.toArray() : $node[0];
    }

    removeClass(elm, cls) {
        $(elm).removeClass(cls);
    }

    rename(elm, name) {
        let newElm;
        if (elm.nodeName !== name.toUpperCase()) {
            newElm = this.create(name);
            ArrUtils.each(this.getAttribs(elm), (attrNode) => {
                this.setAttrib(newElm, attrNode.nodeName, this.getAttrib(elm, attrNode.nodeName));
            });
            this.replace(newElm, elm, true);
        }
        return newElm || elm;
    }

    replace(newElm, oldElm, keepChildren) {
        return this.run(oldElm, (oldElm) => {
            if (Array.isArray(oldElm)) {
                newElm = newElm.cloneNode(true);
            }

            if (keepChildren) {
                ArrUtils.each(Tools.grep(oldElm.childNodes), (node) => {
                    newElm.appendChild(node);
                });
            }

            return oldElm.parentNode.replaceChild(newElm, oldElm);
        });
    }

    run(elm, func, scope) {
        let result, node = typeof elm === "string" ? this.get(elm) : elm;
        if (!node) {
            return false;
        }

        if (Tools.isArray(node) && (node.length || node.length === 0)) {
            result = [];
            ArrUtils.each(node, (elm, i) => {
                if (elm) {
                    if (typeof elm === "string") {
                        elm = this.get(elm);
                    }
                    result.push(func.call(scope, elm, i));
                }
            });
            return result;
        }

        return func.call(scope ? scope : this, node);
    }

    select(selector, scope) {
        return $(selector, this.get(scope) || this.settings.rootElement || this.doc).toArray();
    }

    setAttrib(elm, name, value) {
        $(elm).attr(name, value);
    }

    setAttribs(elm, attrs) {
        $(elm).attr(attrs);
    }

    setHTML(elm, html) {
        let $elm = $(elm);
        if (Env.isIE) {
            $elm.each((i, target) => {
                if (target.canHaveHTML === false) {
                    return;
                }

                // Remove all child nodes, IE keeps empty text nodes in DOM
                while (target.firstChild) {
                    target.removeChild(target.firstChild);
                }
                try {
                    // IE will remove comments from the beginning
                    // unless you padd the contents with something
                    target.innerHTML = '<br>' + html;
                    target.removeChild(target.firstChild);
                }
                catch (ex) {
                    // IE sometimes produces an unknown runtime error on innerHTML if it's a div inside a p
                    $('<div></div>').html('<br>' + html).contents().slice(1).appendTo(target);
                }
                return html;
            });
        }
        else {
            $elm.html(html);
        }
    }

    setOuterHTML(elm, html) {
        $(elm).each(() => {
            try {
                if ("outerHTML" in this) {
                    this.outerHTML = html;
                    return;
                }
            }
            catch (ex) {
                // Ignore
            }
        });
    }

    serializeStyle(stylesArg, name) {
        return this._styles.serialize(stylesArg, name);
    }

    setStyle(elm, name, value) {
        let $elm = $(elm).css(name, value);
        if (this.settings.updateStyles) {
            this.__updateInternalStyleAttr(this._styles, $elm);
        }
    }

    setStyles(elm, stylesArg) {
        let $elm = $(elm).css(stylesArg);
        if (settings.updateStyles) {
            this.__updateInternalStyleAttr(this._styles, $elm);
        }
    }

    split(parentElm, splitElm, replacementElm) {
        let rng = this.createRng(), contents1, contents2, parentNode;

        if (parentElm && splitElm) {
            rng.setStart(parentElm.parentNode, this.nodeIndex(parentElm));
            rng.setEnd(splitElm.parentNode, this.nodeIndex(splitElm));
            contents1 = rng.extractContents();

            rng = this.createRng();
            rng.setStart(splitElm.parentNode, this.nodeIndex(splitElm) + 1);
            rng.setEnd(parentElm.parentNode, this.nodeIndex(parentElm) + 1);
            contents2 = rng.extractContents();

            parentNode = parentElm.parentNode;
            parentNode.insertBefore(TrimNode.trimNode(self, contents1), parentElm);

            if (replacementElm) {
                parentNode.insertBefore(replacementElm, parentElm);
            }
            else {
                parentNode.insertBefore(splitElm, parentElm);
            }
            
            parentNode.insertBefore(TrimNode.trimNode(self, contents2), parentElm);
            this.remove(parentElm);

            return replacementElm || splitElm;
        }
    }

    toHex(rgbVal) {
        return this._styles.toHex(Tools.trim(rgbVal));
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

    __updateInternalStyleAttr(styles, $elm) {
        let rawValue = $elm.attr("style"),
            value = styles.serialize(styles.parse(rawValue), $elm[0].nodeName);
        if (!value) {
            value = null;
        }
        $elm.attr("data-editor-style", value);
    }

    static get $() {
        return jQuery;
    }

    static get DOM() {
        return new DOMUtils(document);
    }

    static addClass(elm, cls) {
        $(elm.dom()).addClass(cls);
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

    static attr(elm, attr) {
        $(elm.dom()).attr(attr);
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
        return this.is(scope, selector) ? Option.some(scope) :
               Tools.isFunction(isRoot) && isRoot(scope) ? Option.none() : this.ancestor(scope, selector, isRoot);
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
        element.dom().textContent = '';
        Tools.each(this.children(element), (rogue) => {
            this.remove(rogue);
        });
    }

    static eq(e1, e2) {
        return e1.dom() === e2.dom();
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
            prop = styles.getPropertyValue(property),
            isSupported = (dom.style !== undefined && Tools.isFunction(dom.style.getPropertyValue)),
            v = (prop === '' && !this.__isInBody(element)) ? (isSupported ? dom.style.getPropertyValue(property) : '') : prop;
        return v === null ? undefined : v;
    }

    static getRawCss(element, property) {
        let dom = element.dom(),
            isSupported = (dom.style !== undefined && Tools.isFunction(dom.style.getPropertyValue)),
            raw = isSupported ? dom.style.getPropertyValue(property) : '';
        return Option.from(raw).filter((r) => r.length > 0);
    }

    static getDescendant(scope, selector) {
        let base = (scope === undefined ? document : scope.dom());
        return this.__bypassSelector(base) ? Option.none() : Option.from(base.querySelector(selector)).map(this.fromDom);
    }

    static hasClass(elm, name) {
        return $(elm.dom()).hasClass(name);
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
        return this.toArray(element, prevSibling).reverse();
    }

    static prepend(parent, element) {
        let firstChild = this.firstChild(parent);
        firstChild.fold(() => {
            this.append(parent, element);
        },
        (v) => {
            parent.dom().insertBefore(element.dom(), v.dom());
        });
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

    static removeClass(elm, name) {
        return $(elm.dom()).removeClass(name);
    }

    static shallow(orig) {
        return this.fromDom(orig.dom().cloneNode(false));
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

    static unwrap(wrapper) {
        let children = this.children(wrapper);
        if (children.length > 0) {
            this.before(wrapper, children);
        }
        this.remove(wrapper);
    }

    static wrap(element, wrapper) {
        this.before(element, wrapper);
        this.append(wrapper, element);
    }

    static __bypassSelector(dom) {
        return !(NodeType.isElement(dom) || NodeType.isDocument(dom)) || dom.childElementCount === 0;
    }

    static __isInBody(elm) {
        let dom = NodeType.isText(elm) ? elm.dom().parentNode : elm.dom();
        return dom !== undefined && dom !== null && dom.ownerDocument.body.contains(dom);
    }
}