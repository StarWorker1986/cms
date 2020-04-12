import Option from "../util/Option";
import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";

export default class TableDeleteAction {
    static getActionFromRange(root, rng) {
        return this.__getTableSelectionFromRng(root, rng).bind(this.__getAction);
    }

    static getActionFromCells(cells) {
        let deleteAction = Tools.generate([
            { removeTable: ["element"] },
            { emptyCells: ["cells"] }
        ]);
        return deleteAction.emptyCells(cells);
    }

    static __getAction(tableSelection) {
        let deleteAction = Tools.generate([
            { removeTable: ["element"] },
            { emptyCells: ["cells"] }
        ]);
        return this.__getSelectedCells(tableSelection).map((selected) => {
            let cells = tableSelection.cells();
            return selected.length === cells.length ? deleteAction.removeTable(tableSelection.table())
                                                    : deleteAction.emptyCells(selected);
        });
    }

    static __getCellIndex(cells, cell) {
        return Tools.findIndex(cells, (x) => DOMUtils.eq(x, cell));
    }

    static __getCellRng(rng, isRoot) {
        let startCell = this.__getClosestCell(rng.startContainer, isRoot),
            endCell = this.__getClosestCell(rng.endContainer, isRoot),
            tableCellRng = Tools.immutable("start", "end");

        return Option.liftN([startCell, endCell], tableCellRng)
                     .filter((cellRng) => DOMUtils.eq(cellRng.start(), cellRng.end()) === false)
                     .filter((cellRng) => this.__isWithinSameTable(isRoot, cellRng))
                     .orThunk(() => this.__partialSelection(isRoot, rng));
    }

    static __getCellRangeFromStartTable(cellRng, isRoot) {
        let tableCellRng = Tools.immutable("start", "end")
        return this.__getClosestTable(cellRng.start(), isRoot).bind((table) => {
            return Tools.last(this.__getTableCells(table)).map((endCell) => {
                return tableCellRng(cellRng.start(), endCell);
            });
        });
    }

    static __getClosestCell(container, isRoot) {
        return DOMUtils.closest(DOMUtils.fromDom(container), "td,th", isRoot);
    }

    static __getClosestTable(cell, isRoot) {
        return DOMUtils.ancestor(cell, "table", isRoot);
    }

    static __getSelectedCells(tableSelection) {
        return Option.liftN([
            this.__getCellIndex(tableSelection.cells(), tableSelection.rng().start()),
            this.__getCellIndex(tableSelection.cells(), tableSelection.rng().end())
        ], (startIndex, endIndex) => tableSelection.cells().slice(startIndex, endIndex + 1));
    }

    static __getTableCells(table) {
        return DOMUtils.getAllDescendants(table, "td,th");
    }

    static __getTableFromCellRng(cellRng, isRoot) {
        return this.__getClosestTable(cellRng.start(), isRoot).bind((startParentTable) => {
            return this.__getClosestTable(cellRng.end(), isRoot).bind((endParentTable) => {
                return DOMUtils.eq(startParentTable, endParentTable) ? Option.some(startParentTable) : Option.none();
            });
        });
    }

    static __getTableSelectionFromRng(root, rng) {
        let isRoot = (elm) => DOMUtils.eq(root, elm);
        return this.__getCellRng(rng, isRoot).bind((cellRng) => this.__getTableSelectionFromCellRng(cellRng, isRoot));
    }

    static __getTableSelectionFromCellRng(cellRng, isRoot) {
        let tableSelection = Tools.immutable("rng", "table", "cells")
        return this.__getTableFromCellRng(cellRng, isRoot).map((table) => {
            return tableSelection(cellRng, table, this.__getTableCells(table));
        });
    }

    static __isWithinSameTable(isRoot, cellRng) {
        return this.__getTableFromCellRng(cellRng, isRoot).isSome();
    }

    static __partialSelection(isRoot, rng) {
        let startCell = this.__getClosestCell(rng.startContainer, isRoot),
            endCell = this.__getClosestCell(rng.endContainer, isRoot),
            tableCellRng = Tools.immutable("start", "end");

        return rng.collapsed ? Option.none() : Option.liftN([startCell, endCell], tableCellRng).fold(
            () => {
                return startCell.fold(() => {
                    return endCell.bind((endCell) => {
                        return this.__getClosestTable(endCell, isRoot).bind((table) => {
                            return Tools.head(this.__getTableCells(table)).map((startCell) => {
                                return tableCellRng(startCell, endCell);
                            });
                        });
                    });
                },
            (startCell) => {
                return this.__getClosestTable(startCell, isRoot).bind((table) => {
                    return Tools.last(this.__getTableCells(table)).map((endCell) => {
                            return tableCellRng(startCell, endCell);
                        });
                    });
                });
            },
            (cellRng) => {
                return this.__isWithinSameTable(isRoot, cellRng) ?
                       Option.none() : this.__getCellRangeFromStartTable(cellRng, isRoot);
            });
    }
}