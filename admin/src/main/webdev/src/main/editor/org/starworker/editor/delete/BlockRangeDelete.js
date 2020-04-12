import Option from "../util/Option";
import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import DeleteUtils from "./DeleteUtils";
import MergeBlocks from "./MergeBlocks";
import ElementType from "../dom/ElementType";
import DOMUtils from "../dom/DOMUtils";

export default class BlockRangeDelete {
    static backspaceDelete(editor, forward) {
        return editor.selection.isCollapsed() ? false : this.__deleteRange(editor);
    }

    static __deleteRange(editor) {
        let rootNode = DOMUtils.fromDom(editor.getBody()), rng = editor.selection.getRng();
        return this.__isEverythingSelected(rootNode, rng) ? this.__emptyEditor(editor)
                                                          : this.__deleteRangeMergeBlocks(rootNode, editor.selection);
    }

    static __deleteRangeMergeBlocks(rootNode, selection) {
        let rng = selection.getRng();
        return Option.liftN([
            DeleteUtils.getParentBlock(rootNode, DOMUtils.fromDom(rng.startContainer)),
            DeleteUtils.getParentBlock(rootNode, DOMUtils.fromDom(rng.endContainer))
        ],
        (block1, block2) => {
            if (DOMUtils.eq(block1, block2) === false) {
                rng.deleteContents();
                MergeBlocks.mergeBlocks(rootNode, true, block1, block2).each((pos) => {
                    selection.setRng(pos.toRange());
                });
                return true;
            }
            else {
                return false;
            }
        }).getOr(false);
    }

    static __emptyEditor(editor) {
        editor.setContent('');
        editor.selection.setCursorLocation();
        return true;
    }

    static __isEverythingSelected(root, rng) {
        let noPrevious = CaretFinder.prevPosition(root.dom(), CaretPosition.fromRangeStart(rng)).isNone(),
            noNext = CaretFinder.nextPosition(root.dom(), CaretPosition.fromRangeEnd(rng)).isNone();
        return !this.__isSelectionInTable(root, rng) && noPrevious && noNext;
    }

    static __isRawNodeInTable(root, rawNode) {
        let node = DOMUtils.fromDom(rawNode), isRoot = (elm) => DOMUtils.eq(elm, root);
        return DOMUtils.ancestor(node, ElementType.isTableCell, isRoot).isSome();
    }

    static __isSelectionInTable(root, rng) {
        return this.__isRawNodeInTable(root, rng.startContainer) || this.__isRawNodeInTable(root, rng.endContainer);
    }
}