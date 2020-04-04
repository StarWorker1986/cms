import DOMUtils from "../dom/DOMUtils";
import BlockMergeBoundary from './BlockMergeBoundary';
import MergeBlocks from './MergeBlocks';
var backspaceDelete = function (editor, forward) {
    var position;
    var rootNode = DOMUtils.fromDom(editor.getBody());
    position = BlockMergeBoundary.read(rootNode.dom(), forward, editor.selection.getRng()).bind(function (blockBoundary) {
        return MergeBlocks.mergeBlocks(rootNode, forward, blockBoundary.from().block(), blockBoundary.to().block());
    });
    position.each(function (pos) {
        editor.selection.setRng(pos.toRange());
    });
    return position.isSome();
};
export default {
    backspaceDelete: backspaceDelete
};
