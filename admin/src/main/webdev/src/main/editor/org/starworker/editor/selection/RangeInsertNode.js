import NodeType from "../dom/NodeType";
import Option from "../util/Option";

export default class RangeInsertNode {
    static rangeInsertNode(dom, rng, node) {
        if (NodeType.isDocumentFragment(node)) {
            this.__insertFragment(dom, rng, node);
        }
        else {
            this.__insertNode(dom, rng, node);
        }
    }

    static __insertNode(dom, rng, node) {
        rng.insertNode(node);
        this.__trimEmptyTextNode(dom, node.previousSibling);
        this.__trimEmptyTextNode(dom, node.nextSibling);
    }

    static insertFragment(dom, rng, frag) {
        let firstChild = Option.from(frag.firstChild), lastChild = Option.from(frag.lastChild);
        rng.insertNode(frag);
        firstChild.each((child) => this.__trimEmptyTextNode(dom, child.previousSibling));
        lastChild.each((child) => this.__trimEmptyTextNode(dom, child.nextSibling));
    }

    static __trimEmptyTextNode(dom, node) {
        if (NodeType.isText(node) && node.data.length === 0) {
            dom.remove(node);
        }
    }
}