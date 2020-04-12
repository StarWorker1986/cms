import Option from "../util/Option";
import Tools from "../util/Tools";
import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import CaretUtils from "../caret/CaretUtils";
import DeleteUtils from "./DeleteUtils";
import Empty from "../dom/Empty";
import NodeType from "../dom/NodeType";
import ElementType from "../dom/ElementType";
import DOMUtils from "../dom/DOMUtils";
import CaretBr from "../caret/CaretBr";

export default class CefDeleteAction {
    static read(root, forward, rng) {
        let normalizedRange = CaretUtils.normalizeRange(forward ? 1 : -1, root, rng),
            from = CaretPosition.fromRangeStart(normalizedRange),
            rootElement = DOMUtils.fromDom(root),
            deleteAction = Tools.generate([
                { remove: ["element"] },
                { moveToElement: ["element"] },
                { moveToPosition: ["position"] }
            ]);

        if (forward === false && CaretUtils.isAfterContentEditableFalse(from)) {
            return Option.some(deleteAction.remove(from.getNode(true)));
        }
        else if (forward && CaretUtils.isBeforeContentEditableFalse(from)) {
            return Option.some(deleteAction.remove(from.getNode()));
        }
        else if (forward === false && CaretUtils.isBeforeContentEditableFalse(from)
                                   && CaretBr.isAfterBr(rootElement, from)) {
            return CaretBr.findPreviousBr(rootElement, from).map((br) => deleteAction.remove(br.getNode()));
        }
        else if (forward && CaretUtils.isAfterContentEditableFalse(from)
                         && CaretBr.isBeforeBr(rootElement, from)) {
            return CaretBr.findNextBr(rootElement, from).map((br) => deleteAction.remove(br.getNode()));
        }
        else {
            return this.__getContentEditableAction(root, forward, from, deleteAction);
        }
    }

    static __deleteEmptyBlockOrMoveToCef(root, forward, from, to, deleteAction) {
        let toCefElm = to.getNode(forward === false);
        return DeleteUtils.getParentBlock(DOMUtils.fromDom(root), DOMUtils.fromDom(from.getNode())).map((blockElm) => {
            return Empty.isEmpty(blockElm) ? deleteAction.remove(blockElm.dom()) : deleteAction.moveToElement(toCefElm);
        }).orThunk(() => Option.some(deleteAction.moveToElement(toCefElm)));
    }

    static __findCefPosition(root, forward, from, deleteAction) {
        let self = this;
        return CaretFinder.fromPosition(forward, root, from).bind((to) => {
            if (self.__isCompoundElement(to.getNode())) {
                return Option.none();
            }
            else if (self.__isDeleteFromCefDifferentBlocks(root, forward, from, to)) {
                return Option.none();
            }
            else if (forward && NodeType.isContentEditableFalse(to.getNode())) {
                return self.__deleteEmptyBlockOrMoveToCef(root, forward, from, to, deleteAction);
            }
            else if (forward === false && NodeType.isContentEditableFalse(to.getNode(true))) {
                return self.__deleteEmptyBlockOrMoveToCef(root, forward, from, to, deleteAction);
            }
            else if (forward && CaretUtils.isAfterContentEditableFalse(from)) {
                return Option.some(deleteAction.moveToPosition(to));
            }
            else if (forward === false && CaretUtils.isBeforeContentEditableFalse(from)) {
                return Option.some(deleteAction.moveToPosition(to));
            }
            else {
                return Option.none();
            }
        });
    }

    static __getContentEditableBlockAction(forward, elm, deleteAction) {
        if (forward && NodeType.isContentEditableFalse(elm.nextSibling)) {
            return Option.some(deleteAction.moveToElement(elm.nextSibling));
        }
        else if (forward === false && NodeType.isContentEditableFalse(elm.previousSibling)) {
            return Option.some(deleteAction.moveToElement(elm.previousSibling));
        }
        else {
            return Option.none();
        }
    }

    static __getContentEditableAction(root, forward, from, deleteAction) {
        let self = this;
        if (self.__isAtContentEditableBlockCaret(forward, from)) {
            return self.__getContentEditableBlockAction(forward, from.getNode(forward === false), deleteAction)
                       .fold(() => self.__findCefPosition(root, forward, from, deleteAction), Option.some);
        }
        else {
            return self.__findCefPosition(root, forward, from, deleteAction).bind((da) => {
                return self.__skipMoveToActionFromInlineCefToContent(root, from, da);
            });
        }
    }

    static __isAtContentEditableBlockCaret(forward, from) {
        let elm = from.getNode(forward === false), caretLocation = forward ? "after" : "before";
        return NodeType.isElement(elm) && elm.getAttribute("data-editor-caret") === caretLocation;
    }

    static __isCompoundElement(node) {
        return ElementType.isTableCell(DOMUtils.fromDom(node)) || ElementType.isListItem(DOMUtils.fromDom(node));
    }

    static __isDeleteFromCefDifferentBlocks(root, forward, from, to) {
        let inSameBlock = (elm) => ElementType.isInline(DOMUtils.fromDom(elm)) && !CaretUtils.isInSameBlock(from, to, root);
        return CaretUtils.getRelativeCefElm(!forward, from).fold(() => CaretUtils.getRelativeCefElm(forward, to).fold(Option.constant(false), inSameBlock), inSameBlock);
    }

    static __skipMoveToActionFromInlineCefToContent(root, from, deleteAction) {
        return deleteAction.fold(
            (elm) => Option.some(deleteAction.remove(elm)),
            (elm) => Option.some(deleteAction.moveToElement(elm)), 
            (to) => {
                if (CaretUtils.isInSameBlock(from, to, root)) {
                    return Option.none();
                }
                else {
                    return Option.some(deleteAction.moveToPosition(to));
                }
            });
    }
}