import Option from "../util/Option";
import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import NodeType from "../dom/NodeType";
import EditorSettings from "../EditorSettings";
import CaretContainer from "../caret/CaretContainer";
import CaretPosition from "../caret/CaretPosition";
import CaretUtils from "../caret/CaretUtils";

export default class InlineUtils {
    static findRootInline(isInlineTarget, rootNode, pos) {
        let parents = this.__findInlineParents(isInlineTarget, rootNode, pos);
        return Option.from(parents[parents.length - 1]);
    }

    static hasSameParentBlock(rootNode, node1, node2) {
        let block1 = CaretUtils.getParentBlock(node1, rootNode),
            block2 = CaretUtils.getParentBlock(node2, rootNode);
        return block1 && block1 === block2;
    }

    static isAtZwsp(pos) {
        return CaretContainer.isBeforeInline(pos) || CaretContainer.isAfterInline(pos);
    }

    static isInlineTarget(editor, elm) {
        let selector = EditorSettings.getString(editor, "inlineBoundariesSelector").getOr("a[href],code");
        return DOMUtils.is(DOMUtils.fromDom(elm), selector);
    }

    static isRtl(element) {
        let bidi = /[\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC]/
        return DOMUtils.DOM.getStyle(element, "direction", true) === "rtl" || bidi.test(element.textContent);
    }

    static normalizePosition(forward, pos) {
        if (!pos) {
            return pos;
        }

        let container = pos.container(), offset = pos.offset();
        if (forward) {
            if (CaretContainer.isCaretContainerInline(container)) {
                if (NodeType.isText(container.nextSibling)) {
                    return new CaretPosition(container.nextSibling, 0);
                }
                else {
                    return CaretPosition.after(container);
                }
            }
            else {
                return CaretContainer.isBeforeInline(pos) ? new CaretPosition(container, offset + 1) : pos;
            }
        }
        else {
            if (CaretContainer.isCaretContainerInline(container)) {
                if (NodeType.isText(container.previousSibling)) {
                    return new CaretPosition(container.previousSibling, container.previousSibling.data.length);
                }
                else {
                    return CaretPosition.before(container);
                }
            }
            else {
                return CaretContainer.isAfterInline(pos) ? new CaretPosition(container, offset - 1) : pos;
            }
        }
    }

    static normalizeForwards(forward) {
        return this.normalizePosition(forward, true);
    }

    static normalizeBackwards(forward) {
        return this.normalizePosition(forward, false);
    }

    static __findInlineParents(isInlineTarget, rootNode, pos) {
        return Tools.filter(DOMUtils.DOM.getParents(pos.container(), "*", rootNode), isInlineTarget);
    }
}