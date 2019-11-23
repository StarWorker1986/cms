import CaretPosition from "../caret/CaretPosition";
import ElementType from "../dom/ElementType";
import DOMUtils from "../dom/DOMUtils";
import NodeType from "../dom/NodeType";
import CaretFinder from "../caret/CaretFinder";
import RangeNormalizer from "./RangeNormalizer";

export default class MultiClickSelection {
    static setup(editor) {
        editor.on("click", (e) => {
            if (e.detail >= 3) {
                normalizeSelection(editor);
            }
        });
    }

    static __normalizeSelection(editor) {
        let rng = editor.selection.getRng(), startPos = CaretPosition.fromRangeStart(rng), endPos = CaretPosition.fromRangeEnd(rng);
        let isTextBlockNode = (node) => {
            return NodeType.isElement(node) && ElementType.isTextBlock(DOMUtils.fromDom(node));
        };
        
        if (CaretPosition.isElementPosition(startPos)) {
            let container = startPos.container();
            if (isTextBlockNode(container)) {
                CaretFinder.firstPositionIn(container).each((pos) => {
                    return rng.setStart(pos.container(), pos.offset());
                });
            }
        }

        if (CaretPosition.isElementPosition(endPos)) {
            let container = startPos.container();
            if (isTextBlockNode(container)) {
                CaretFinder.lastPositionIn(container).each((pos) => {
                    return rng.setEnd(pos.container(), pos.offset());
                });
            }
        }

        editor.selection.setRng(RangeNormalizer.normalize(rng));
    }
}