import GetBookmark from "./bookmark/GetBookmark";
import Levels from "./undo/Levels";
import Tools from "./util/Tools";

export default class UndoManager {
    constructor(editor) {
        this.editor = editor;
        this.data = [];
        this.typing = false;
        
        this._index = 0;
        this._locks = 0;
        this._isFirstTypedCharacter = null;
        this._beforeBookmark = null;
        this.__init(editor, data);
    }

    add(level, event) {
        let editor = this.editor, data = this._data, i, settings = editor.settings, lastLevel, currentLevel;

        currentLevel = Levels.createFromEditor(editor);
        level = level || {};
        level = Tools.extend(level, currentLevel);
        if (this._locks !== 0 || editor.removed) {
            return null;
        }

        lastLevel = data[this._index];
        if (editor.fire("BeforeAddUndo", { level: level, lastLevel: lastLevel, originalEvent: event }).isDefaultPrevented()) {
            return null;
        }

        // Add undo level if needed
        if (lastLevel && Levels.isEq(lastLevel, level)) {
            return null;
        }

        // Set before bookmark on previous level
        if (data[this._index]) {
            data[this._index].beforeBookmark = beforeBookmark;
        }

        // Time to compress
        if (settings.customUndoRedoLevels) {
            if (data.length > settings.customUndoRedoLevels) {
                for (i = 0; i < data.length - 1; i++) {
                    data[i] = data[i + 1];
                }
                data.length--;
                this._index = data.length;
            }
        }

        // Get a non intrusive normalized bookmark
        level.bookmark = GetBookmark.getUndoBookmark(editor.selection);
        // Crop array if needed
        if (this._index < data.length - 1) {
            data.length = this._index + 1;
        }

        data.push(level);
        this._index = data.length - 1;

        let args = { level: level, lastLevel: lastLevel, originalEvent: event };
        editor.fire("AddUndo", args);
        if (this._index > 0) {
            editor.setDirty(true);
            editor.fire("change", args);
        }

        return level;
    }

    beforeChange() {
        if (this._locks === 0) {
            this._beforeBookmark = GetBookmark.getUndoBookmark(editor.selection);
        }
    }

    clear() {
        this.data = [];
        this.typing = false;
        this._index = 0;
        this.editor.fire("ClearUndos");
    }
   
    extra(callback1, callback2) {
        let lastLevel, bookmark;
        if (this.transact(callback1)) {
            bookmark = this._data[this._index].bookmark;
            lastLevel = this._data[this._index - 1];
            Levels.applyToEditor(this.editor, lastLevel, true);
            if (this.transact(callback2)) {
                this._data[this._index - 1].beforeBookmark = bookmark;
            }
        }
    }

    hasUndo() {
        // Has undo levels or typing and content isn"t the same as the initial level
        return this._index > 0 || (this.typing && this.data[0] && !Levels.isEq(Levels.createFromEditor(this.editor), this.data[0]));
    }
  
    hasRedo() {
        return this._index < this.data.length - 1 && !this.typing;
    }

    ignore(callback) {
        try {
            this._locks++;
            callback();
        }
        finally {
            this._locks--;
        }
    }

    redo() {
        let level;
        if (this._index < this.data.length - 1) {
            level = this.data[++this._index];
            Levels.applyToEditor(editor, level, false);
            editor.setDirty(true);
            editor.fire("redo", { level: level });
        }
        return level;
    }

    transact(callback) {
        if (this.typing) {
            if (this._locks === 0) {
                this.typing = false;
            }
            this.add();
        }
        this.beforeChange();
        this.ignore(callback);
        return this.add();
    }

    undo() {
        let level, editor = this.editor;
        if (this.typing) {
            this.add();
            if (this._locks === 0) {
                this.typing = false;
            }
        }

        if (this._index > 0) {
            level = this.data[--this._index];
            Levels.applyToEditor(editor, level, true);
            editor.setDirty(true);
            editor.fire("undo", { level: level });
        }

        return level;
    }

    __addNonTypingUndoLevel(e) {
        if (this._locks === 0) {
            this.typing = false;
        }
        this.add({}, e);
    }

    __init(editor, data) {
        editor.on("init", () => {
            this.add();
        });

        // Get position before an execCommand is processed
        editor.on("BeforeExecCommand", (e) => {
            let cmd = e.command;
            if (cmd !== "Undo" && cmd !== "Redo" && cmd !== "editorRepaint") {
                if (this.typing) {
                    if (this._locks === 0) {
                        this.typing = false;
                    }
                    this.add();
                }
                this.beforeChange();
            }
        });

        // Add undo level after an execCommand call was made
        editor.on("ExecCommand", (e) => {
            let cmd = e.command;
            if (cmd !== "Undo" && cmd !== "Redo" && cmd !== "mceRepaint") {
                this.__addNonTypingUndoLevel(e);
            }
        });

        editor.on("ObjectResizeStart Cut", () => {
            this.beforeChange();
        });

        editor.on("SaveContent ObjectResized blur", this.__addNonTypingUndoLevel);
        editor.on("DragEnd", this.__addNonTypingUndoLevel);
        
        editor.on("KeyUp", (e) => {
            let keyCode = e.keyCode;

            // If key is prevented then don"t add undo level
            // This would happen on keyboard shortcuts for example
            if (e.isDefaultPrevented()) {
                return;
            }
            if ((keyCode >= 33 && keyCode <= 36) || (keyCode >= 37 && keyCode <= 40) || keyCode === 45 || e.ctrlKey) {
                this.__addNonTypingUndoLevel();
                editor.nodeChanged();
            }
            if (keyCode === 46 || keyCode === 8) {
                editor.nodeChanged();
            }

            // Fire a TypingUndo/Change event on the first character entered
            if (this._isFirstTypedCharacter && this.typing && Levels.isEq(Levels.createFromEditor(editor), data[0]) === false) {
                if (editor.isDirty() === false) {
                    editor.setDirty(true);
                    editor.fire("change", { level: data[0], lastLevel: null });
                }
                editor.fire("TypingUndo");
                this._isFirstTypedCharacter = false;
                editor.nodeChanged();
            }
        });

        editor.on("KeyDown", (e) => {
            let keyCode = e.keyCode;
            // If key is prevented then don"t add undo level
            // This would happen on keyboard shortcuts for example
            if (e.isDefaultPrevented()) {
                return;
            }
            // Is character position keys left,right,up,down,home,end,pgdown,pgup,enter
            if ((keyCode >= 33 && keyCode <= 36) || (keyCode >= 37 && keyCode <= 40) || keyCode === 45) {
                if (this.typing) {
                    this.__addNonTypingUndoLevel(e);
                }
                return;
            }

            // If key isn"t Ctrl+Alt/AltGr
            let modKey = (e.ctrlKey && !e.altKey) || e.metaKey;
            if ((keyCode < 16 || keyCode > 20) && keyCode !== 224 && keyCode !== 91 && !this.typing && !modKey) {
                this.beforeChange();
                if (this._locks === 0) {
                    this.typing = true;
                }
                this.add({}, e);
                this._isFirstTypedCharacter = true;
            }
        });

        editor.on("MouseDown", (e) => {
            if (this.typing) {
                this.__addNonTypingUndoLevel(e);
            }
        });

        // For detecting when user has replaced text using the browser built-in spell checker
        editor.on("input", (e) => {
            if (e.inputType && (e.inputType === "insertReplacementText" || (e.inputType === "insertText" && e.data === null))) {
                addNonTypingUndoLevel(e);
            }
        });

        // Add keyboard shortcuts for undo/redo keys
        editor.addShortcut("meta+z", '', "Undo");
        editor.addShortcut("meta+y,meta+shift+z", '', "Redo");
        editor.on("AddUndo Undo Redo ClearUndos", (e) => {
            if (!e.isDefaultPrevented()) {
                editor.nodeChanged();
            }
        });
    }
}