import Tools from "../util/Tools";
import NodeType from "../dom/NodeType";
import Zwsp from "../text/Zwsp";
import CaretContainer from "./CaretContainer";

export default class CaretContainerInline {
    static insertInline(before, node) { 
        return before ? this.__insertBefore(node) : this.__insertAfter(node); 
    }

    static insertInlineBefore() {
        return Tools.curry(this.insertInline, true);
    }

    static insertInlineAfter() {
        return Tools.curry(this.insertInline, false);
    }

    static __insertBefore(node) {
        if (NodeType.isText(node.previousSibling)) {
            if (CaretContainer.endsWithCaretContainer(node.previousSibling)) {
                return node.previousSibling;
            }
            else {
                node.previousSibling.appendData(Zwsp.ZWSP);
                return node.previousSibling;
            }
        }
        else if (NodeType.isText(node)) {
            if (CaretContainer.startsWithCaretContainer(node)) {
                return node;
            }
            else {
                node.insertData(0, Zwsp.ZWSP);
                return node;
            }
        }
        else {
            var newNode = this.__createZwsp(node);
            node.parentNode.insertBefore(newNode, node);
            return newNode;
        }
    }

    static insertAfter(node) {
        if (NodeType.isText(node.nextSibling)) {
            if (CaretContainer.startsWithCaretContainer(node.nextSibling)) {
                return node.nextSibling;
            }
            else {
                node.nextSibling.insertData(0, Zwsp.ZWSP);
                return node.nextSibling;
            }
        }
        else if (NodeType.isText(node)) {
            if (CaretContainer.endsWithCaretContainer(node)) {
                return node;
            }
            else {
                node.appendData(Zwsp.ZWSP);
                return node;
            }
        }
        else {
            let newNode = this.__createZwsp(node);
            if (node.nextSibling) {
                node.parentNode.insertBefore(newNode, node.nextSibling);
            }
            else {
                node.parentNode.appendChild(newNode);
            }
            return newNode;
        }
    }

    static __createZwsp = function (node) {
        return node.ownerDocument.createTextNode(Zwsp.ZWSP); 
    }
}
