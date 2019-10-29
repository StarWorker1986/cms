import NodeType from "../dom/NodeType";
import Zwsp from "../text/Zwsp";

export default class CaretContainer {
    static isCaretContainerBlock(node) {
        if (NodeType.isText(node)) {
            node = node.parentNode;
        }
        return NodeType.isElement(node) && node.hasAttribute("data-editor-caret");
    }

    static isCaretContainerInline(node) {
        return NodeType.isText(node) && Zwsp.isZwsp(node.data);
    }

    static isCaretContainer(node) {
        return this.isCaretContainerBlock(node) || this.isCaretContainerInline(node);
    }

    static hasContent(node) {
        return node.firstChild !== node.lastChild || !NodeType.isBr(node.firstChild);
    }

    static startsWithCaretContainer(node) {
        return NodeType.isText(node) && node.data[0] === Zwsp.ZWSP;
    }

    static endsWithCaretContainer(node) { 
        return NodeType.isText(node) && node.data[node.data.length - 1] === Zwsp.ZWSP; 
    }

    static insertInline(node, before) {
        let sibling, textNode, parentNode;

        textNode = node.ownerDocument.createTextNode(Zwsp.ZWSP);
        parentNode = node.parentNode;
        if (!before) {
            sibling = node.nextSibling;
            if (NodeType.isText(sibling)) {
                if (this.isCaretContainer(sibling)) {
                    return sibling;
                }
                if (this.startsWithCaretContainer(sibling)) {
                    sibling.splitText(1);
                    return sibling;
                }
            }
            if (node.nextSibling) {
                parentNode.insertBefore(textNode, node.nextSibling);
            }
            else {
                parentNode.appendChild(textNode);
            }
        }
        else {
            sibling = node.previousSibling;
            if (NodeType.isText(sibling)) {
                if (this.isCaretContainer(sibling)) {
                    return sibling;
                }
                if (this.endsWithCaretContainer(sibling)) {
                    return sibling.splitText(sibling.data.length - 1);
                }
            }
            parentNode.insertBefore(textNode, node);
        }

        return textNode;
    }

    static prependInline(node) {
        if (NodeType.isText(node)) {
            let data = node.data;
            if (data.length > 0 && data.charAt(0) !== Zwsp.ZWSP) {
                node.insertData(0, Zwsp.ZWSP);
            }
            return node;
        }
        else {
            return null;
        }
    }

    static appendInline(node) {
        if (NodeType.isText(node)) {
            let data = node.data;
            if (data.length > 0 && data.charAt(data.length - 1) !== Zwsp.ZWSP) {
                node.insertData(data.length, Zwsp.ZWSP);
            }
            return node;
        }
        else {
            return null;
        }
    }

    static isBeforeInline(pos) {
        let container = pos.container();
        if (!pos || !NodeType.isText(container)) {
            return false;
        }
        return container.data.charAt(pos.offset()) === Zwsp.ZWSP || pos.isAtStart() && this.isCaretContainerInline(container.previousSibling);
    }

    static isAfterInline(pos) {
        let container = pos.container();
        if (!pos || !NodeType.isText(container)) {
            return false;
        }
        return container.data.charAt(pos.offset() - 1) === Zwsp.ZWSP || pos.isAtEnd() && this.isCaretContainerInline(container.nextSibling);
    }

    static insertBlock(blockName, node, before) {
        let blockNode, parentNode;

        blockNode = node.ownerDocument.createElement(blockName);
        blockNode.setAttribute("data-editor-caret", before ? "before" : "after");
        blockNode.setAttribute("data-editor-bogus", "all");
        blockNode.appendChild(this.__createBogusBr());
        parentNode = node.parentNode;

        if (!before) {
            if (node.nextSibling) {
                parentNode.insertBefore(blockNode, node.nextSibling);
            }
            else {
                parentNode.appendChild(blockNode);
            }
        }
        else {
            parentNode.insertBefore(blockNode, node);
        }
        return blockNode;
    }

    static showCaretContainerBlock(caretContainer) {
        if (caretContainer && caretContainer.hasAttribute("data-editor-caret")) {
            this.__trimBogusBr(caretContainer);
            caretContainer.removeAttribute("data-editor-caret");
            caretContainer.removeAttribute("data-editor-bogus");
            caretContainer.removeAttribute("style");
            caretContainer.removeAttribute("_moz_abspos");
            return caretContainer;
        }
        return null;
    }

    static isRangeInCaretContainerBlock(range) { 
        return this.isCaretContainerBlock(range.startContainer);
    }

    static __createBogusBr() {
        let br = document.createElement("br");
        br.setAttribute("data-editor-bogus", "1");
        return br;
    }

    static __trimBogusBr(elm) {
        let br = elm.getElementsByTagName("br"), lastBr = br[br.length - 1];
        if (NodeType.isBogus(lastBr)) {
            lastBr.parentNode.removeChild(lastBr);
        }
    }
}