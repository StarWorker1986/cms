import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import RangeNodes from "./RangeNodes";

export default class MultiRange {
    static getRanges(selection) {
        let ranges = [];
        if (selection) {
            for (let i = 0; i < selection.rangeCount; i++) {
                ranges.push(selection.getRangeAt(i));
            }
        }
        return ranges;
    }

    static getSelectedNodes(ranges) {
        return Tools.bind(ranges, (range) => {
            let node = RangeNodes.getSelectedNode(range);
            return node ? [DOMUtils.fromDom(node)] : [];
        });
    }

    static hasMultipleRanges(selection) {
        return this.getRanges(selection).length > 1;
    }
}