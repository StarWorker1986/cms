import Tools from "../util/Tools";

export default class EventProcessRanges {
    static processRanges(editor, ranges) {
        return Tools.map(ranges, (range) => {
            let evt = editor.fire("GetSelectionRange", { range: range });
            return evt.range !== range ? evt.range : range;
        });
    }
}