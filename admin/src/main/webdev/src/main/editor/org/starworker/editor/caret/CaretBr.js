import Tools from "../util/Tools";
import CaretUtils from "./CaretUtils";
import ElementType from "../dom/ElementType";
import Parents from "../dom/Parents";
import CaretFinder from "./CaretFinder";

export default class CaretBr {
    static __isBr(pos) {
        return CaretUtils.getElementFromPosition(pos).exists(ElementType.isBr);
    }

    static __findBr(forward, root, pos) {
        let parentBlocks = Tools.filter(Parents.parentsAndSelf(pos.container, root), ElementType.isBlock),
            scope = Tools.head(parentBlocks).getOr(root);

        return CaretFinder.fromPosition(forward, scope, pos).filter(this.__isBr);
    }

    static isBeforeBr(root, pos) {
        return CaretUtils.getElementFromPosition(pos).exists(ElementType.isBr) || this.__findBr(true, root, pos).isSome();
    }

    static isAfterBr(root, pos) {
        return CaretUtils.getElementFromPosition(pos).exists(ElementType.isBr) || this.__findBr(true, root, pos).isSome();
    }

    static findPreviousBr() {
        return Tools.curry(this.__findBr, false);
    }

    static findNextBr() {
        return Tools.curry(this.__findBr, true);
    }
}
