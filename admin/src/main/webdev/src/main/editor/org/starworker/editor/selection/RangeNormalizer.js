import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import CaretUtils from "../caret/CaretUtils";

export default class RangeNormalizer {
    static normalize(rng) {
        return rng.collapsed ? rng : this.__normalizeBlockSelectionRange(rng);
    }

    static __createRange(sc, so, ec, eo) {
        let rng = document.createRange();
        rng.setStart(sc, so);
        rng.setEnd(ec, eo);
        return rng;
    }

    static __normalizeBlockSelectionRange(rng) {
        let startPos = CaretPosition.fromRangeStart(rng),
            endPos = CaretPosition.fromRangeEnd(rng),
            rootNode = rng.commonAncestorContainer;

        return CaretFinder.fromPosition(false, rootNode, endPos).map((newEndPos) => {
            if (!CaretUtils.isInSameBlock(startPos, endPos, rootNode) && CaretUtils.isInSameBlock(startPos, newEndPos, rootNode)) {
                return this.__createRange(startPos.container(), startPos.offset(), newEndPos.container(), newEndPos.offset());
            }
            else {
                return rng;
            }
        }).getOr(rng);
    }
}