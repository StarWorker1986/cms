import Option from "../util/Option";
import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import CaretFinder from '../caret/CaretFinder';
import CaretPosition from '../caret/CaretPosition';
import DeleteUtils from './DeleteUtils';
import Empty from '../dom/Empty';
import NodeType from '../dom/NodeType';

var BlockPosition = Tools.immutable('block', 'position');
var BlockBoundary = Tools.immutable('from', 'to');
var getBlockPosition = function (rootNode, pos) {
    var rootElm = DOMUtils.fromDom(rootNode);
    var containerElm = DOMUtils.fromDom(pos.container());
    return DeleteUtils.getParentBlock(rootElm, containerElm).map(function (block) {
        return BlockPosition(block, pos);
    });
};
var isDifferentBlocks = function (blockBoundary) {
    return DOMUtils.eq(blockBoundary.from().block(), blockBoundary.to().block()) === false;
};
var hasSameParent = function (blockBoundary) {
    return DOMUtils.parent(blockBoundary.from().block()).bind(function (parent1) {
        return DOMUtils.parent(blockBoundary.to().block()).filter(function (parent2) {
            return DOMUtils.eq(parent1, parent2);
        });
    }).isSome();
};
var isEditable = function (blockBoundary) {
    return NodeType.isContentEditableFalse(blockBoundary.from().block()) === false && NodeType.isContentEditableFalse(blockBoundary.to().block()) === false;
};
var skipLastBr = function (rootNode, forward, blockPosition) {
    if (NodeType.isBr(blockPosition.position().getNode()) && Empty.isEmpty(blockPosition.block()) === false) {
        return CaretFinder.positionIn(false, blockPosition.block().dom()).bind(function (lastPositionInBlock) {
            if (lastPositionInBlock.isEqual(blockPosition.position())) {
                return CaretFinder.fromPosition(forward, rootNode, lastPositionInBlock).bind(function (to) {
                    return getBlockPosition(rootNode, to);
                });
            }
            else {
                return Option.some(blockPosition);
            }
        }).getOr(blockPosition);
    }
    else {
        return blockPosition;
    }
};
var readFromRange = function (rootNode, forward, rng) {
    var fromBlockPos = getBlockPosition(rootNode, CaretPosition.fromRangeStart(rng));
    var toBlockPos = fromBlockPos.bind(function (blockPos) {
        return CaretFinder.fromPosition(forward, rootNode, blockPos.position()).bind(function (to) {
            return getBlockPosition(rootNode, to).map(function (blockPos) {
                return skipLastBr(rootNode, forward, blockPos);
            });
        });
    });
    return Option.liftN([fromBlockPos, toBlockPos], BlockBoundary).filter(function (blockBoundary) {
        return isDifferentBlocks(blockBoundary) && hasSameParent(blockBoundary) && isEditable(blockBoundary);
    });
};
var read = function (rootNode, forward, rng) {
    return rng.collapsed ? readFromRange(rootNode, forward, rng) : Option.none();
};
export default {
    read: read
};