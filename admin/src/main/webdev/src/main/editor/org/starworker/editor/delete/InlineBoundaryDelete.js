import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";
import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import CaretUtils from "../caret/CaretUtils";
import DeleteElement from "./DeleteElement";
import BoundaryCaret from "../keyboard/BoundaryCaret";
import BoundaryLocation from "../keyboard/BoundaryLocation";
import BoundarySelection from "../keyboard/BoundarySelection";
import InlineUtils from "../keyboard/InlineUtils";

export default class InlineBoundaryDelete {
    static backspaceDelete(editor, caret, forward) {
        if (editor.selection.isCollapsed() && editor.settings.inlineBoundaries !== false) {
            let from = CaretPosition.fromRangeStart(editor.selection.getRng());
            return backspaceDeleteCollapsed(editor, caret, forward, from);
        }
        return false;
    }

    static __backspaceDeleteCollapsed(editor, caret, forward, from) {
        let rootNode = this.__rescope(editor.getBody(), from.container()),
            isInlineTarget = (elm) => InlineUtils.isInlineTarget(editor, elm),
            fromLocation = BoundaryLocation.readLocation(isInlineTarget, rootNode, from);

        return fromLocation.bind((location) => {
            if (forward) {
                return location.fold(
                    Option.constant(Option.some(BoundaryLocation.inside(location))), // Before
                    Option.none, // Start
                    Option.constant(Option.some(BoundaryLocation.outside(location))), // End
                    Option.none // After
                );
            }
            else {
                return location.fold(
                    Option.none, // Before
                    Option.constant(Option.some(BoundaryLocation.outside(location))), // Start
                    Option.none, // End
                    Option.constant(Option.some(BoundaryLocation.inside(location))) // After
                );
            }
        }).map(this.__setCaretLocation(editor, caret)).getOrThunk(() => {
            let toPosition = CaretFinder.navigate(forward, rootNode, from),
                toLocation = toPosition.bind((pos) => BoundaryLocation.readLocation(isInlineTarget, rootNode, pos));
            
            if (fromLocation.isSome() && toLocation.isSome()) {
                return InlineUtils.findRootInline(isInlineTarget, rootNode, from).map((elm) => {
                    if (this.__hasOnlyTwoOrLessPositionsLeft(elm)) {
                        DeleteElement.deleteElement(editor, forward, DOMUtils.fromDom(elm));
                        return true;
                    }
                    else {
                        return false;
                    }
                }).getOr(false);
            }
            else {
                return toLocation.bind((_) => {
                    return toPosition.map((to) => {
                        if (forward) {
                            this.__deleteFromTo(editor, caret, from, to);
                        }
                        else {
                            this.__deleteFromTo(editor, caret, to, from);
                        }
                        return true;
                    });
                }).getOr(false);
            }
        });
    }

    static __deleteFromTo(editor, caret, from, to) {
        let rootNode = editor.getBody(), isInlineTarget = (elm) => InlineUtils.isInlineTarget(editor, elm);
        editor.undoManager.ignore(() => {
            editor.selection.setRng(this.__rangeFromPositions(from, to));
            editor.execCommand("Delete");
            BoundaryLocation.readLocation(isInlineTarget, rootNode, CaretPosition.fromRangeStart(editor.selection.getRng()))
                            .map(BoundaryLocation.inside)
                            .map(this.__setCaretLocation(editor, caret));
        });
        editor.nodeChanged();
    }

    static __hasOnlyTwoOrLessPositionsLeft(elm) {
        return Option.liftN([
            CaretFinder.firstPositionIn(elm),
            CaretFinder.lastPositionIn(elm)
        ],
        (firstPos, lastPos) => {
            let normalizedFirstPos = InlineUtils.normalizePosition(true, firstPos),
                normalizedLastPos = InlineUtils.normalizePosition(false, lastPos);
            return CaretFinder.nextPosition(elm, normalizedFirstPos)
                              .map((pos) => pos.isEqual(normalizedLastPos))
                              .getOr(true);
        }).getOr(true);
    }

    static __rangeFromPositions(from, to) {
        let range = document.createRange();
        range.setStart(from.container(), from.offset());
        range.setEnd(to.container(), to.offset());
        return range;
    }

    static __rescope(rootNode, node) {
        let parentBlock = CaretUtils.getParentBlock(node, rootNode);
        return parentBlock ? parentBlock : rootNode;
    }

    static __setCaretLocation(editor, caret) {
        return (location) => {
            return BoundaryCaret.renderCaret(caret, location).map((pos) => {
                BoundarySelection.setCaretPosition(editor, pos);
                return true;
            }).getOr(false);
        };
    }
}