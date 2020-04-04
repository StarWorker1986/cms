import ApplyFormat from "./ApplyFormat";
import MatchFormat from "./MatchFormat";
import RemoveFormat from "./RemoveFormat";

export default class ToggleFormat {
    static toggle(editor, formats, name, vars, node) {
        let fmt = formats.get(name);
        if (MatchFormat.match(editor, name, vars, node) && (!("toggle" in fmt[0]) || fmt[0].toggle)) {
            RemoveFormat.remove(editor, name, vars, node);
        }
        else {
            ApplyFormat.applyFormat(editor, name, vars, node);
        }
    }
}
