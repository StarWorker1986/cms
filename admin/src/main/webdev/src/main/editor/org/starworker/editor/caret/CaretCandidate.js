import Tools from "../util/Tools";
import NodeType from "../dom/NodeType";
import CaretContainer from "./CaretContainer";

const isAtomicInline = NodeType.matchNodeNames("img input textarea hr iframe video audio object");

export default class CaretCandidate {
    static __isUnselectable(node) {
        return NodeType.isElement(node) && node.getAttribute("unselectable") === "true";
    }

    static __isNonUiContentEditableFalse(node) {
        return this.__isUnselectable(node) === false && NodeType.isContentEditableFalse(node);
    }

    static isCaretCandidate(node) {
        let isInvalidTextElement = NodeType.matchNodeNames("script style textarea"),
            isTable = NodeType.matchNodeNames("table");

        if (CaretContainer.isCaretContainer(node)) {
            return false;
        }
        if (NodeType.isText(node)) {
            if (isInvalidTextElement(node.parentNode)) {
                return false;
            }
            return true;
        }
        return isAtomicInline(node) || NodeType.isBr(node) || isTable(node) || this.__isNonUiContentEditableFalse(node);
    }

    static __isAtomicContentEditableFalse(node) {
        if (!this.__isNonUiContentEditableFalse(node)) {
            return false;
        }
        return Tools.foldl(Tools.from(node.getElementsByTagName('*')), (result, elm) => {
            return result || NodeType.isContentEditableTrue(elm);
        }, false) !== true;
    }

    static isAtomic(node) {
        return isAtomicInline(node) || this.__isAtomicContentEditableFalse(node);
    }

    static isInEditable(node, root) {
        for (node = node.parentNode; node && node !== root; node = node.parentNode) {
            if (this.__isNonUiContentEditableFalse(node)) {
                return false;
            }
            if (NodeType.isContentEditableTrue(node)) {
                return true;
            }
        }
        return true;
    }

    static isEditableCaretCandidate(node, root) {
        return this.isCaretCandidate(node) && this.isInEditable(node, root);
    }
}
