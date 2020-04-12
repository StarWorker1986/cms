import DOMUtils from "../dom/DOMUtils";
import BlockMergeBoundary from "./BlockMergeBoundary";
import MergeBlocks from "./MergeBlocks";

export default class BlockBoundaryDelete {
    static backspaceDelete(editor, forward) {
        let position, rootNode = DOMUtils.fromDom(editor.getBody());
        position = BlockMergeBoundary.read(rootNode.dom(), forward, editor.selection.getRng()).bind((blockBoundary) => {
            return MergeBlocks.mergeBlocks(rootNode, forward, blockBoundary.from().block(), blockBoundary.to().block());
        });
        position.each((pos) => {
            editor.selection.setRng(pos.toRange());
        });
        return position.isSome();
    }
}
