import Option from "../util/Option";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import PlatformDetection from "../util/PlatformDetection";
import NodeType from "./NodeType";

export default class DOMUtils {
    constructor(doc, settings) {
        this.doc = doc;

        if (!settings) {
            settings = {};
        }
        this.settings = settings;
    }

    createRng() {
        return this.doc.createRange();
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

    static contains(e1, e2) {
        let d1 = e1.dom(), d2 = e2.dom(), browser = PlatformDetection.detect().browser;
        browser.isIE() ? this.documentPositionContainedBy(d1, d2) : (d1 === d2 ? false : d1.contains(d2));
    }

    static documentPositionContainedBy(a, b) {
        return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0;
    }

    static deep(orig) {
        return this.fromDom(orig.dom().cloneNode(true));
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

    static lastChild(element) {
        return this.child(element, element.dom().childNodes.length - 1);
    }

    static nextSibling(element) {
        let dom = element.dom();
        return Option.from(dom.nextSibling).map(this.fromDom);
    }

    static name(element) {
        return element.dom().noteName.toLowerCase();
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
}