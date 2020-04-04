import DOMUtils from "./DOMUtils";
import ElementType from "./ElementType";
import NodeType from "./NodeType";
import Tools from "../util/Tools";

export default class TrimNode {
    static trimNode(dom, node) {
        let i, children = node.childNodes, trimmedLength;

        if (NodeType.isElement(node) && this.__isBookmarkNode(node)) {
            return;
        }

        for (i = children.length - 1; i >= 0; i--) {
            this.trimNode(dom, children[i]);
        }

        if (NodeType.isDocument(node) === false) {
            // Keep non whitespace text nodes
            if (NodeType.isText(node) && node.nodeValue.length > 0) {
                // Keep if parent element is a block or if there is some useful content
                trimmedLength = Tools.trim(node.nodeValue).length;
                if (dom.isBlock(node.parentNode) || trimmedLength > 0) {
                    return;
                }

                // Also keep text nodes with only spaces if surrounded by spans.
                // eg. "<p><span>a</span> <span>b</span></p>" should keep space between a and b
                if (trimmedLength === 0 && this.__surroundedBySpans(node)) {
                    return;
                }
            }
            else if (NodeType.isElement(node)) {
                // If the only child is a bookmark then move it up
                children = node.childNodes;
                if (children.length === 1 && this.__isBookmarkNode(children[0])) {
                    node.parentNode.insertBefore(children[0], node);
                }

                // Keep non empty elements and void elements
                if (children.length || ElementType.isVoid(DOMUtils.fromDom(node))) {
                    return;
                }
            }
            dom.remove(node);
        }

        return node;
    }

    static __isBookmarkNode(node) {
        return node && node.tagName === "SPAN" && node.getAttribute("data-editor-type") === "bookmark";
    }

    static __surroundedBySpans(node) {
        let previousIsSpan = node.previousSibling && node.previousSibling.nodeName === "SPAN",
            nextIsSpan = node.nextSibling && node.nextSibling.nodeName === "SPAN";
        return previousIsSpan && nextIsSpan;
    }
}