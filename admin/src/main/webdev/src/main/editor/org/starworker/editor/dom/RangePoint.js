import Tools from "../util/Tools";
import GeomClientRect from "../geom/ClientRect";

export default class RangePoint {
    static isXYWithinRange(clientX, clientY, range) {
        if (range.collapsed) {
            return false;
        }
        return Tools.foldl(range.getClientRects(), (state, rect) => {
            return state || GeomClientRect.containsXY(rect, clientX, clientY);
        }, false);
    }
}