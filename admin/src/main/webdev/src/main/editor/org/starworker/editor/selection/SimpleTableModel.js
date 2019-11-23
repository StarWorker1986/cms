import Tools from "../util/Tools";
import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";

export default class SimpleTableModel {
    static fromDom(tableElm) {
        let table = this.__tableModel(DOMUtils.shallow(tableElm), 0, []);
        Tools.each(DOMUtils.getAllDescendants(tableElm, "tr"), (tr, y) => {
            Tools.each(DOMUtils.getAllDescendants(tr, "td,th"), (td, x) => {
                this.__fillout(table, this.__skipCellsX(table, x, y), y, tr, td);
            });
        });
        return this.__tableModel(table.element(), this.__getWidth(table.rows()), table.rows());
    }

    static subsection(table, startElement, endElement) {
        return this.__findElementPos(table, startElement).bind((startPos) => {
            return this.__findElementPos(table, endElement).map((endPos) => {
                return this.__subTable(table, startPos, endPos);
            });
        });
    }

    static toDom(table) {
        return this.__createDomTable(table, this.__modelRowsToDomRows(table));
    }

    static __cellExists(table, x, y) {
        let rows = table.rows(), cells = rows[y] ? rows[y].cells() : [];
        return !!cells[x];
    }

    static __createDomTable(table, rows) {
        let tableElement = DOMUtils.shallow(table.element()), tableBody = DOMUtils.fromTag("tbody");

        Tools.each(rows, r => tableBody.dom().appendChild(r));
        tableElement.dom().appendChild(tableBody.dom());
        return tableElement;
    }

    static __extractRows(table, sx, sy, ex, ey) {
        let newRows = [], rows = table.rows();
        for (let y = sy; y <= ey; y++) {
            let cells = rows[y].cells(),
                slice = sx < ex ? cells.slice(sx, ex + 1) : cells.slice(ex, sx + 1);
            newRows.push(this.__tableRow(rows[y].element(), slice));
        }
        return newRows;
    }

    static __fillout(table, x, y, tr, td) {
        let rowspan = this.__getSpan(td, "rowspan"),
            colspan = this.__getSpan(td, "colspan"),
            rows = table.rows();

        for (let y2 = y; y2 < y + rowspan; y2++) {
            if (!rows[y2]) {
                rows[y2] = this.__tableRow(DOMUtils.deep(tr), []);
            }

            for (let x2 = x; x2 < x + colspan; x2++) {
                let cells = rows[y2].cells();
                cells[x2] = (y2 === y && x2 === x) ? td : DOMUtils.shallow(td);
            }
        }
    }

    static __findElementPos(table, element) {
        let rows = table.rows();
        for (let j = 0; j < rows.length; j++) {
            let cells = rows[j].cells();
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].dom() === element.dom()) {
                    return Option.some(this.__cellPosition(i, j));
                }
            }
        }

        return Option.none();
    }

    static __getSpan(td, key) {
        let value = parseInt(td.dom().getAttribute(key), 10);
        return isNaN(value) ? 1 : value;
    }

    static __getWidth(rows) {
        return Tools.foldl(rows, (acc, row) => {
            return row.cells().length > acc ? row.cells().length : acc;
        }, 0);
    }

    static __modelRowsToDomRows(table) {
        return Tools.map(table.rows(), (row) => {
            let cells = Tools.map(row.cells(), (cell) => {
                let td = DOMUtils.deep(cell);
                td.dom().removeAttribute("colspan");
                td.dom().removeAttribute("rowspan");
                return td;
            });

            let tr = DOMUtils.shallow(row.element());
            Tools.each(cells, c => tr.dom().appendChild(c.dom()));
            return tr;
        });
    }

    static __skipCellsX(table, x, y) {
        while (this.__cellExists(table, x, y)) {
            x++;
        }
        return x;
    }

    static __subTable(table, startPos, endPos) {
        let sx = startPos.x(), sy = startPos.y(), ex = endPos.x(), ey = endPos.y(),
            newRows = sy < ey ? this.__extractRows(table, sx, sy, ex, ey) : this.__extractRows(table, sx, ey, ex, sy);

        return this.__tableModel(table.element(), this.__getWidth(newRows), newRows);
    }

    static get __cellPosition() {
        return Tools.immutable("x", "y");
    }

    static get __tableModel() {
        return Tools.immutable("element", "width", "rows");
    }

    static get __tableRow() {
        return Tools.immutable("element", "cells");
    }
}