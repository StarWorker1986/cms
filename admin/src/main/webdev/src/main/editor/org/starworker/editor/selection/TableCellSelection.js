import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import ElementType from "../dom/ElementType";
import MultiRange from "./MultiRange";

export default class TableCellSelection {
    static getCellsFromRanges(ranges) {
        return Tools.filter(MultiRange.getSelectedNodes(ranges), ElementType.isTableCell);
    }

    static getCellsFromElement(elm) {
        return DOMUtils.getAllDescendants(elm, "td[data-editor-selected],th[data-editor-selected]");
    }

    static getCellsFromElementOrRanges(ranges, element) {
        let selectedCells = this.getCellsFromElement(element), rangeCells = this.getCellsFromRanges(ranges);
        return selectedCells.length > 0 ? selectedCells : rangeCells;
    }

    static getCellsFromEditor(editor) {
        return this.getCellsFromElementOrRanges(MultiRange.getRanges(editor.selection.getSel()), DOMUtils.fromDom(editor.getBody()));
    }
}