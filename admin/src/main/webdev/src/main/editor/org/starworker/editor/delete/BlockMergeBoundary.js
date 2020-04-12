import Option from "../util/Option";
import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import DeleteUtils from "./DeleteUtils";
import Empty from "../dom/Empty";
import NodeType from "../dom/NodeType";

export default class BlockMergeBoundary {
    static read(rootNode, forward, rng) {
        return rng.collapsed ? this.__readFromRange(rootNode, forward, rng) : Option.none();
    }

    static __hasSameParent(blockBoundary) {
        return DOMUtils.parent(blockBoundary.from().block()).bind((parent1) => {
            return DOMUtils.parent(blockBoundary.to().block()).filter((parent2) => {
                return DOMUtils.eq(parent1, parent2);
            });
        }).isSome();
    }

    static __isDifferentBlocks(blockBoundary) {
        return DOMUtils.eq(blockBoundary.from().block(), blockBoundary.to().block()) === false;
    }

    static __isEditable(blockBoundary) {
        return NodeType.isContentEditableFalse(blockBoundary.from().block()) === false
            && NodeType.isContentEditableFalse(blockBoundary.to().block()) === false;
    }

    static __readFromRange(rootNode, forward, rng) {
        let self = this, blockBoundary = Tools.immutable("from", "to"),
            fromBlockPos = this.__getBlockPosition(rootNode, CaretPosition.fromRangeStart(rng)), toBlockPos = fromBlockPos.bind((blockPos) => {
            return CaretFinder.fromPosition(forward, rootNode, blockPos.position()).bind((to) => {
                return self.__getBlockPosition(rootNode, to).map((blockPos) => {
                    return self.__skipLastBr(rootNode, forward, blockPos);
                });
            });
        });
        return Option.liftN([fromBlockPos, toBlockPos], blockBoundary)
                     .filter((blockBoundary) => {
                         return self.__isDifferentBlocks(blockBoundary) && self.__hasSameParent(blockBoundary)
                                                                        && self.__isEditable(blockBoundary)
                     });
    }

    static __getBlockPosition(rootNode, pos) {
        let rootElm = DOMUtils.fromDom(rootNode),
            containerElm = DOMUtils.fromDom(pos.container()),
            blockPosition = Tools.immutable("block", "position");
        return DeleteUtils.getParentBlock(rootElm, containerElm).map((block) => blockPosition(block, pos));
    }

    static __skipLastBr(rootNode, forward, blockPosition) {
        let self = this;
        if (NodeType.isBr(blockPosition.position().getNode()) && Empty.isEmpty(blockPosition.block()) === false) {
            return CaretFinder.positionIn(false, blockPosition.block().dom()).bind((lastPositionInBlock) => {
                if (lastPositionInBlock.isEqual(blockPosition.position())) {
                    return CaretFinder.fromPosition(forward, rootNode,
                           lastPositionInBlock).bind((to) => self.__getBlockPosition(rootNode, to));
                }
                else {
                    return Option.some(blockPosition);
                }
            }).getOr(blockPosition);
        }
        else {
            return blockPosition;
        }
    }
}