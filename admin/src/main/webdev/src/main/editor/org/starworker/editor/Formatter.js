import Cell from "./util/Cell";
import ApplyFormat from "../fmt/ApplyFormat";
import CaretFormat from "../fmt/CaretFormat";
import FormatChanged from "../fmt/FormatChanged";
import FormatRegistry from "../fmt/FormatRegistry";
import MatchFormat from "../fmt/MatchFormat";
import Preview from "../fmt/Preview";
import RemoveFormat from "../fmt/RemoveFormat";
import ToggleFormat from "../fmt/ToggleFormat";
import FormatShortcuts from "../keyboard/FormatShortcuts";

export default class Formatter {
    constructor(editor) {
        FormatShortcuts.setup(editor);
        CaretFormat.setup(editor);

        this._editor = editor;
        this._formats = new FormatRegistry(editor);
        this._formatChangeState = new Cell(null);
    }

    get(name) {
        return this._formats.get(name);
    }

    has(name) {
        return this._formats.has(name);
    }
    
    register(name, format) {
        return this._formats.register(name, format);
    }
    
    unregister(name) {
        return this._formats.unregister(name);
    }
    
    apply(name, vars, root) {
        return ApplyFormat.applyFormat(this._editor, name, vars, root);
    }
    
    remove(name, vars, node, similar) {
        return RemoveFormat.remove(this._editor, name, vars, node, similar);
    }

    toggle(name, vars, node) {
        return ToggleFormat.toggle(this._editor, this._formats, name, vars, node);
    }
    
    match(name, vars, node) {
        return MatchFormat.match(this._editor, name, vars, node);
    }
    
    matchAll(names, vars) {
        return MatchFormat.matchAll(this._editor, names, vars);
    }

    matchNode(node, name, vars, similar) {
        return MatchFormat.matchNode(this._editor, node, name, vars, similar);
    }
    
    canApply(name) {
        return MatchFormat.canApply(this._editor, name);
    }
    
    formatChanged(formats, callback, similar) {
        return FormatChanged.formatChanged(this._editor, this._formatChangeState, formats, callback, similar);
    }
    
    getCssText(format) {
        return Preview.getCssText(this._editor, format);
    }
}