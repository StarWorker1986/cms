import CaretPosition from "../caret/CaretPosition";
import CaretUtils from "../caret/CaretUtils";
import NodeType from "../dom/NodeType";

export default class CefUtils {
    static showCaret(direction, editor, node, before, scrollIntoView) {
        // TODO: Figure out a better way to handle this dependency
        return editor.selectionOverrides.showCaret(direction, node, before, scrollIntoView);
    }

    static getNodeRange(node) {
        let rng = node.ownerDocument.createRange();
        rng.selectNode(node);
        return rng;
    }

    static selectNode(editor, node) {
        let e = editor.fire("BeforeObjectSelected", { target: node });
        if (e.isDefaultPrevented()) {
            return null;
        }
        return this.getNodeRange(node);
    }

    static renderCaretAtRange(editor, range, scrollIntoView) {
        let normalizedRange = CaretUtils.normalizeRange(1, editor.getBody(), range),
            caretPosition = CaretPosition.fromRangeStart(normalizedRange),
            caretPositionNode = caretPosition.getNode();

        if (NodeType.isContentEditableFalse(caretPositionNode)) {
            return this.showCaret(1, editor, caretPositionNode, !caretPosition.isAtEnd(), false);
        }

        let caretPositionBeforeNode = caretPosition.getNode(true);
        if (NodeType.isContentEditableFalse(caretPositionBeforeNode)) {
            return this.showCaret(1, editor, caretPositionBeforeNode, false, false);
        }

        // TODO: Should render caret before/after depending on where you click on the page forces after now
        let ceRoot = editor.dom.getParent(caretPosition.getNode(), (node) => NodeType.isContentEditableFalse(node) || NodeType.isContentEditableTrue(node));
        if (NodeType.isContentEditableFalse(ceRoot)) {
            return this.showCaret(1, editor, ceRoot, false, scrollIntoView);
        }
        return null;
    }

    static renderRangeCaret(editor, range, scrollIntoView) {
        if (!range || !range.collapsed) {
            return range;
        }

        let caretRange = this.renderCaretAtRange(editor, range, scrollIntoView);
        if (caretRange) {
            return caretRange;
        }
        return range;
    }
}