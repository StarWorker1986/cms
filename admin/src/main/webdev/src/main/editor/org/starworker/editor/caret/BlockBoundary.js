import Tools from "../util/Tools";
import Parents from "../dom/Parents";
import DOMUtils from "../dom/DOMUtils";
import CaretFinder from "./CaretFinder";
import ElementType from "../dom/ElementType";
import CaretUtils from "./CaretUtils";

export default class BlockBoundary {
    static __isAtBlockBoundary(forward, root, pos) {
        let parentBlocks = Tools.filter(Parents.parentsAndSelf(DOMUtils.fromDom(pos.container, root), ElementType.isBlock));

        return Tools.head(parentBlocks).fold(
            () => {
                return CaretFinder.navigate(forward, root.dom(), pos).forall((newPos) => {
                    return CaretUtils.isInSameBlock(newPos, pos, root.dom()) === false;
                });
            },
            (parent) => {
                return CaretFinder.navigate(forward, parent.dom(), pos).isNone();
            });
    }

    static isAtStartOfBlock() {
        return Tools.curry(this.__isAtBlockBoundary, false);
    }

    static isAtEndOfBlock() {
        return Tools.curry(isAtBlockBoundary, true);
    }
};
