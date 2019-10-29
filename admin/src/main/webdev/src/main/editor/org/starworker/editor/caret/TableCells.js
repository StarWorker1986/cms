import DOMUtils from "../dom/DOMUtils";
import Tools from "../util/Tools";
import Option from "../util/Option";
import LineReader from "./LineReader";
import GeomClientRect from "../geom/ClientRect";

export default class TableCells {
    static findClosestPositionInAboveCell(table, pos) {
        return Tools.head(pos.getClientRects()).bind((rect) => {
            return this.getClosestCellAbove(table, rect.left, rect.top);
        }).bind(cell => {
            return LineReader.findClosestHorizontalPosition(LineReader.getLastLinePositions(cell), pos);
        });
    }

    static findClosestPositionInBelowCell(table, pos) {
        return Tools.last(pos.getClientRects()).bind(rect => {
            return this.getClosestCellBelow(table, rect.left, rect.top);
        }).bind(cell => {
            return LineReader.findClosestHorizontalPosition(LineReader.getFirstLinePositions(cell), pos);
        });
    }

    static getClosestCellAbove(table, x, y) {
        return this.__getClosestCell(rect => rect.bottom, (corner, y) => corner.y < y, table, x, y);
    }

    static getClosestCellBelow(table, x, y) {
        return this.__getClosestCell(rect => rect.top, (corner, y) => corner.y > y, table, x, y);
    }

    static __deflate(rect, delta) {
        return {
            left: rect.left - delta,
            top: rect.top - delta,
            right: rect.right + delta * 2,
            bottom: rect.bottom + delta * 2,
            width: rect.width + delta,
            height: rect.height + delta
        };
    }

    static __findClosestCorner(corners, x, y) {
        return Tools.foldl(corners, (acc, newCorner) => {
            return acc.fold(() => Option.some(newCorner), oldCorner => {
                let oldDist = Math.sqrt(Math.abs(oldCorner.x - x) + Math.abs(oldCorner.y - y)),
                    newDist = Math.sqrt(Math.abs(newCorner.x - x) + Math.abs(newCorner.y - y));
                return Option.some(newDist < oldDist ? newCorner : oldCorner);
            });
        }, Option.none());
    }

    static __getClosestCell(getYAxisValue, isTargetCorner, table, x, y) {
        let cells = DOMUtils.getAllDescendants(DOMUtils.fromDom(table), "td,th,caption").map(e => e.dom()),
            corners = Tools.filter(this.__getCorners(getYAxisValue, cells), corner => isTargetCorner(corner, y));

        return this.__findClosestCorner(corners, x, y).map(corner => corner.cell);
    }

    static __getCorners(getYAxisValue, tds) {
        return Tools.bind(tds, td => {
            let rect = this.__deflate(GeomClientRect.clone(td.getBoundingClientRect()), -1);
            return [
                { x: rect.left, y: getYAxisValue(rect), cell: td },
                { x: rect.right, y: getYAxisValue(rect), cell: td }
            ];
        });
    }
}