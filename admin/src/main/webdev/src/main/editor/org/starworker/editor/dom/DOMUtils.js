import Option from "../util/Option";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
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

    static before(marker, element) {
        let parent = this.parent(marker);
        parent.each((v) => {
            v.dom().insertBefore(element.dom(), marker.dom());
        });
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

    static getAllDescendants(scope, selector) {
        let base = (scope === undefined ? document : scope.dom());
        return this.__bypassSelector(base) ? [] : ArrUtils.map(base.querySelectorAll(selector), this.fromDom);
    }

    static getDescendant(scope, selector) {
        let base = (scope === undefined ? document : scope.dom());
        return this.__bypassSelector(base) ? Option.none() : Option.from(base.querySelector(selector)).map(this.fromDom);
    }

    static fromDom(node) {
        if (!node) {
            throw new Error("Node cannot be null or undefined");
        }
        return {
            dom: Option.constant(node)
        }
    }

    static fromText(text, scope) {
        let doc = scope || document, node = doc.createTextNode(text);
        return this.fromDom(node);
    }

    static nextSibling(element) {
        let dom = element.dom();
        return Option.from(dom.nextSibling).map(this.fromDom);
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

    static __bypassSelector(dom) {
        return !(NodeType.isElement(dom) || NodeType.isDocument(dom)) || dom.childElementCount === 0;
    }
}