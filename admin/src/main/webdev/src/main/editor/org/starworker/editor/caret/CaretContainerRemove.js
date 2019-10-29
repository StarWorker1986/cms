import Tools from "../util/Tools";
import CaretContainer from "./CaretContainer";
import CaretPosition from "./CaretPosition";
import NodeType from "../dom/NodeType";
import Zwsp from "../text/Zwsp";

export default class CaretContainerRemove {
    static removeAndReposition(container, pos) {
        return CaretPosition.isTextPosition(pos) 
            ? this.__removeTextCaretContainer(container, pos) 
            : this.__removeElementCaretContainer(container, pos);
    }

    static remove(caretContainerNode) {
        if (NodeType.isElement(caretContainerNode) && CaretContainer.isCaretContainer(caretContainerNode)) {
            if (CaretContainer.hasContent(caretContainerNode)) {
                caretContainerNode.removeAttribute("data-editor-caret");
            }
            else {
                this.__removeNode(caretContainerNode);
            }
        }
        if (NodeType.isText(caretContainerNode)) {
            var text = Zwsp.trim(this.__getNodeValue(caretContainerNode));
            this.__setNodeValue(caretContainerNode, text);
        }
    }

    static __removeNode(node) {
        let parentNode = node.parentNode;
        if (parentNode) {
            parentNode.removeChild(node);
        }
    }

    static __getNodeValue(node) {
        try {
            return node.nodeValue;
        }
        catch (ex) {
            return '';
        }
    }

    static __setNodeValue = function (node, text) {
        if (text.length === 0) {
            this.__removeNode(node);
        }
        else {
            node.nodeValue = text;
        }
    }

    static __trimCount(text) {
        let trimmedText = Zwsp.trim(text);
        return { count: text.length - trimmedText.length, text: trimmedText };
    }

    static __removeUnchanged(caretContainer, pos) {
        this.remove(caretContainer);
        return pos;
    }

    static __removeTextAndReposition(caretContainer, pos) {
        let before = this.__trimCount(caretContainer.data.substr(0, pos.offset())),
            after = this.__trimCount(caretContainer.data.substr(pos.offset())),
            text = before.text + after.text;

        if (text.length > 0) {
            this.__setNodeValue(caretContainer, text);
            return new CaretPosition(caretContainer, pos.offset() - before.count);
        }
        else {
            return pos;
        }
    }

    static __removeElementAndReposition(caretContainer, pos) {
        let parentNode = pos.container(),
            newPosition = Tools.indexOf(Tools.from(parentNode.childNodes), caretContainer).map((index) => {
                return index < pos.offset() ? new CaretPosition(parentNode, pos.offset() - 1) : pos;
            }).getOr(pos);
        this.remove(caretContainer);
        return newPosition;
    }

    static __removeTextCaretContainer(caretContainer, pos) {
        return NodeType.isText(caretContainer) && pos.container() === caretContainer
            ? this.__removeTextAndReposition(caretContainer, pos)
            : this.__removeUnchanged(caretContainer, pos);
    }

    static __removeElementCaretContainer(caretContainer, pos) {
        return pos.container() === caretContainer.parentNode
            ? this.__removeElementAndReposition(caretContainer, pos)
            : this.__removeUnchanged(caretContainer, pos);
    }
}