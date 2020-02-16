import CaretCandidate from "../caret/CaretCandidate";
import NodeType from "./NodeType";
import DOMUtils from "./DOMUtils";
import TreeWalker from "./TreeWalker";

export default class Empty {
    static isEmpty(elm) {
        let targetNode = elm.dom(), walker, node, brCount = 0,
            isBogus = NodeType.hasAttribute("data-editor-bogus"),
            isBogusAll = NodeType.hasAttributeValue("data-editor-bogus", "all");

        if (this.__isContent(targetNode, targetNode)) {
            return false;
        }
        else {
            node = targetNode.firstChild;
            if (!node) {
                return true;
            }

            walker = new TreeWalker(node, targetNode);
            do {
                if (isBogusAll(node)) {
                    node = walker.next(true);
                    continue;
                }

                if (isBogus(node)) {
                    node = walker.next();
                    continue;
                }

                if (NodeType.isBr(node)) {
                    brCount++;
                    node = walker.next();
                    continue;
                }

                if (this.__isContent(targetNode, node)) {
                    return false;
                }
                node = walker.next();
            } while (node);

            return brCount <= 1;
        }
    }

    static __hasWhitespacePreserveParent(rootNode, node) {
        let rootElement = DOMUtils.fromDom(rootNode), startNode = DOMUtils.fromDom(node);
        return DOMUtils.ancestor(startNode, "pre,code", (elm) => rootElement.dom() === elm.dom());
    }

    static __isContent(rootNode, node) {
        let isBookmark = NodeType.hasAttribute("data-editor-bookmark");
        return (CaretCandidate.isCaretCandidate(node) && this.__isWhitespace(rootNode, node) === false) || this.__isNamedAnchor(node) || isBookmark(node);
    }

    static __isWhitespace(rootNode, node) {
        return NodeType.isText(node) && /^[ \t\r\n]*$/.test(node.data) && this.__hasWhitespacePreserveParent(rootNode, node) === false;
    }

    static __isNamedAnchor(node) {
        return NodeType.isElement(node) && node.nodeName === 'A' && node.hasAttribute("name");
    }
}