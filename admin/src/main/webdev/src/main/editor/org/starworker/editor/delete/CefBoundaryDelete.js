import CaretUtils from "../caret/CaretUtils";
import HDirection from "../constants/HDirection";
import CaretWalker from "../caret/CaretWalker";
import NodeType from "../dom/NodeType";
import CefUtils from "../keyboard/CefUtils";
import InlineUtils from "../keyboard/InlineUtils";

export default class CefBoundaryDelete {
    static backspaceDelete(editor, forward) {
        let range = editor.selection.getRng();
        if (!NodeType.isText(range.commonAncestorContainer)) {
            return false;
        }

        let direction = forward ? HDirection.Forwards : HDirection.Backwards,
            caretWalker = new CaretWalker(editor.getBody()),
            getNextVisualCaretPosition = (cp) => CaretUtils.getVisualCaretPosition(caretWalker.next, cp),
            getPrevVisualCaretPosition = (cp) => CaretUtils.getVisualCaretPosition(caretWalker.prev, cp),
            getNextPosFn = forward ? getNextVisualCaretPosition : getPrevVisualCaretPosition,
            isBeforeContentEditableFalseFn = forward ? CaretUtils.isBeforeContentEditableFalse
                                                     : CaretUtils.isAfterContentEditableFalse,
            caretPosition = CaretUtils.getNormalizedRangeEndPoint(direction, editor.getBody(), range),
            nextCaretPosition = InlineUtils.normalizePosition(forward, getNextPosFn(caretPosition));

        if (!nextCaretPosition) {
            return false;
        }
        else if (isBeforeContentEditableFalseFn(nextCaretPosition)) {
            return this.__deleteContentAndShowCaret(editor, range, caretPosition.getNode(), direction, forward, nextCaretPosition);
        }

        let peekCaretPosition = getNextPosFn(nextCaretPosition);
        if (peekCaretPosition && isBeforeContentEditableFalseFn(peekCaretPosition)) {
            if (CaretUtils.isMoveInsideSameBlock(nextCaretPosition, peekCaretPosition)) {
                return this.__deleteContentAndShowCaret(editor, range, caretPosition.getNode(), direction, forward, peekCaretPosition);
            }
        }
        return false;
    }

    static __deleteContentAndShowCaret(editor, range, node, direction, forward, peekCaretPosition) {
        let caretRange = CefUtils.showCaret(direction, editor, peekCaretPosition.getNode(!forward), forward, true);

        if (range.collapsed) {
            let deleteRange = range.cloneRange();
            if (forward) {
                deleteRange.setEnd(caretRange.startContainer, caretRange.startOffset);
            }
            else {
                deleteRange.setStart(caretRange.endContainer, caretRange.endOffset);
            }
            deleteRange.deleteContents();
        }
        else {
            range.deleteContents();
        }

        editor.selection.setRng(caretRange);
        if (NodeType.isText(node) && node.data.length === 0) {
            editor.dom.remove(node);
        }

        return true;
    }
}