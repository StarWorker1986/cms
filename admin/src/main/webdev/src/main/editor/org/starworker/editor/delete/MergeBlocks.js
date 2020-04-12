import Option from "../util/Option";
import Tools from "../util/Tools";
import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import ElementType from "../dom/ElementType";
import DOMUtils from "../dom/DOMUtils";
import Empty from "../dom/Empty";
import PaddingBr from "../dom/PaddingBr";
import Parents from "../dom/Parents";

export default class MergeBlocks {
    static mergeBlocks(rootNode, forward, block1, block2) {
        return forward ? this.__mergeBlockInto(rootNode, block2, block1)
                       : this.__mergeBlockInto(rootNode, block1, block2);
    }

    static __extractChildren(block) {
        let children = this.__getChildrenUntilBlockBoundary(block);
        Tools.each(children, DOMUtils.remove);
        return children;
    }

    static __findInsertionPoint(toBlock, block) {
        let parentsAndSelf = Parents.parentsAndSelf(block, toBlock);
        return Option.from(parentsAndSelf[parentsAndSelf.length - 1]);
    }

    static __getChildrenUntilBlockBoundary(block) {
        let children = DOMUtils.children(block);
        return Tools.findIndex(children, ElementType.isBlock).fold(() => children, (index) => children.slice(0, index));
    }

    static __getInsertionPoint(fromBlock, toBlock) {
        return DOMUtils.contains(toBlock, fromBlock) ? this.__findInsertionPoint(toBlock, fromBlock) : Option.none();
    }

    static __isEmptyBefore(el) {
        return Tools.filter(DOMUtils.prevSiblings(el), (el) => !Empty.isEmpty(el)).length === 0;
    }

    static __mergeBlockInto(rootNode, fromBlock, toBlock) {
        this.__trimBr(true, fromBlock);
        this.__trimBr(false, toBlock);
        return this.__getInsertionPoint(fromBlock, toBlock)
                   .fold(() => this.__sidelongBlockMerge(rootNode, fromBlock, toBlock),
                         (point) => this.__nestedBlockMerge(rootNode, fromBlock, toBlock, point));
    }

   static __nestedBlockMerge(rootNode, fromBlock, toBlock, insertionPoint) {
        if (Empty.isEmpty(toBlock)) {
            PaddingBr.fillWithPaddingBr(toBlock);
            return CaretFinder.firstPositionIn(toBlock.dom());
        }
        if (this.__isEmptyBefore(insertionPoint) && Empty.isEmpty(fromBlock)) {
            DOMUtils.before(insertionPoint, DOMUtils.fromTag("br"));
        }

        let position = CaretFinder.prevPosition(toBlock.dom(), CaretPosition.before(insertionPoint.dom()));
        Tools.each(this.__extractChildren(fromBlock), (child) => {
            DOMUtils.before(insertionPoint, child);
        });
        this.__removeEmptyRoot(rootNode, fromBlock);
        return position;
    }

    static __removeEmptyRoot(rootNode, block) {
        let parents = Parents.parentsAndSelf(block, rootNode);
        return Tools.find(parents.reverse(), Empty.isEmpty).each(DOMUtils.remove);
    }

    static __sidelongBlockMerge(rootNode, fromBlock, toBlock) {
        if (Empty.isEmpty(toBlock)) {
            DOMUtils.remove(toBlock);
            if (Empty.isEmpty(fromBlock)) {
                PaddingBr.fillWithPaddingBr(fromBlock);
            }
            return CaretFinder.firstPositionIn(fromBlock.dom());
        }

        let position = CaretFinder.lastPositionIn(toBlock.dom());
        Tools.each(this.__extractChildren(fromBlock), (child) => {
            DOMUtils.append(toBlock, child);
        });
        this.__removeEmptyRoot(rootNode, fromBlock);
        return position;
    }

    static __trimBr(first, block) {
        CaretFinder.positionIn(first, block.dom())
                   .map((position) => position.getNode())
                   .map(DOMUtils.fromDom)
                   .filter(ElementType.isBr)
                   .each(DOMUtils.remove);
    }
}