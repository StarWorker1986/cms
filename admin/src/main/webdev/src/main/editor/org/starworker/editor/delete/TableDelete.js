import Option from "../util/Option";
import Tools from "../util/Tools";
import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import DeleteElement from "./DeleteElement";
import TableDeleteAction from "./TableDeleteAction";
import ElementType from "../dom/ElementType";
import DOMUtils from "../dom/DOMUtils";
import Empty from "../dom/Empty";
import PaddingBr from "../dom/PaddingBr";
import Parents from "../dom/Parents";
import TableCellSelection from "../selection/TableCellSelection";

export default class TableDelete {
    static __backspaceDelete(editor, forward) {
        let startElm = DOMUtils.fromDom(editor.selection.getStart(true)),
            cells = TableCellSelection.getCellsFromEditor(editor);
        return editor.selection.isCollapsed() && cells.length === 0 ?
               this.__deleteCaret(editor, forward, startElm) : this.__deleteRange(editor, startElm);
    }

    static __emptyCells(editor, cells) {
        Tools.each(cells, PaddingBr.fillWithPaddingBr);
        editor.selection.setCursorLocation(cells[0].dom(), 0);
        return true;
    }

    static __deleteTableElement(editor, table) {
        DeleteElement.deleteElement(editor, false, table);
        return true;
    }

    static __deleteCellRange(editor, rootElm, rng) {
        return TableDeleteAction.getActionFromRange(rootElm, rng).map((action) => {
            return action.fold((table) => this.__deleteTableElement(editor, table),
                               (cells) => this.__emptyCells(editor, cells));
        });
    }

    static __deleteTableRange(editor, rootElm, rng, startElm) {
        return this.__getParentCaption(rootElm, startElm).fold(() => this.__deleteCellRange(editor, rootElm, rng),
                                                        (caption) => this.__emptyElement(editor, caption))
                                                  .getOr(false);
    }

    static __deleteRange(editor, startElm) {
        let rootNode = DOMUtils.fromDom(editor.getBody()),
            rng = editor.selection.getRng(),
            selectedCells = TableCellSelection.getCellsFromEditor(editor);
        return selectedCells.length !== 0 ? this.__emptyCells(editor, selectedCells)
                                          : this.__deleteTableRange(editor, rootNode, rng, startElm);
    }

    static __getParentCell(rootElm, elm) {
        return Tools.find(Parents.parentsAndSelf(elm, rootElm), ElementType.isTableCell);
    }

    static __getParentCaption(rootElm, elm) {
        return Tools.find(Parents.parentsAndSelf(elm, rootElm), (elm) => DOMUtils.name(elm) === "caption");
    }

    static __deleteBetweenCells(editor, rootElm, forward, fromCell, from) {
        return CaretFinder.navigate(forward, editor.getBody(), from).bind((to) => {
            return this.__getParentCell(rootElm, DOMUtils.fromDom(to.getNode())).map((toCell) => {
                return DOMUtils.eq(toCell, fromCell) === false;
            });
        });
    }

    static __emptyElement(editor, elm) {
        PaddingBr.fillWithPaddingBr(elm);
        editor.selection.setCursorLocation(elm.dom(), 0);
        return Option.some(true);
    }

    static __isDeleteOfLastCharPos(fromCaption, forward, from, to) {
        return CaretFinder.firstPositionIn(fromCaption.dom()).bind((first) => {
            return CaretFinder.lastPositionIn(fromCaption.dom()).map((last) => {
                return forward ? from.isEqual(first) && to.isEqual(last) : from.isEqual(last) && to.isEqual(first);
            });
        }).getOr(true);
    }

    static __validateCaretCaption(rootElm, fromCaption, to) {
        return this.__getParentCaption(rootElm, DOMUtils.fromDom(to.getNode())).map((toCaption) => {
            return DOMUtils.eq(toCaption, fromCaption) === false;
        });
    }

    static __deleteCaretInsideCaption(editor, rootElm, forward, fromCaption, from) {
        return CaretFinder.navigate(forward, editor.getBody(), from).bind((to) => {
            return this.__isDeleteOfLastCharPos(fromCaption, forward, from, to) ?
                   this.__emptyElement(editor, fromCaption) : this.__validateCaretCaption(rootElm, fromCaption, to);
        }).or(Option.some(true));
    }

    static __deleteCaretCells(editor, forward, rootElm, startElm) {
        let from = CaretPosition.fromRangeStart(editor.selection.getRng());
        return this.__getParentCell(rootElm, startElm).bind((fromCell) => {
            return Empty.isEmpty(fromCell) ? this.__emptyElement(editor, fromCell)
                                           : this.__deleteBetweenCells(editor, rootElm, forward, fromCell, from);
        });
    }

    static __deleteCaretCaption(editor, forward, rootElm, fromCaption) {
        let from = CaretPosition.fromRangeStart(editor.selection.getRng());
        return Empty.isEmpty(fromCaption) ? this.__emptyElement(editor, fromCaption) :
               this.__deleteCaretInsideCaption(editor, rootElm, forward, fromCaption, from);
    }

    static __deleteCaret(editor, forward, startElm) {
        let rootElm = DOMUtils.fromDom(editor.getBody());
        return this.__getParentCaption(rootElm, startElm).fold(
            () => {
                return this.__deleteCaretCells(editor, forward, rootElm, startElm);
            },
            (fromCaption) => {
                return this.__deleteCaretCaption(editor, forward, rootElm, fromCaption);
            }
        )
        .getOr(false);
    }
}