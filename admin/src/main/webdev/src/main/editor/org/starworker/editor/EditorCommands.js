import Env from "./util/Env";
import Tools from "./util/Tools";
import ArrUtils from "./util/ArrUtils";
import InsertContent from "./content/InsertContent";
import DeleteCommands from "./delete/DeleteCommands";
import FontCommands from "./commands/FontCommands";
import IndentOutdent from "./commands/IndentOutdent";
import NodeType from "./dom/NodeType";
import InsertBr from "./newline/InsertBr";
import InsertNewLine from "./newline/InsertNewLine";
import SelectionBookmark from "./selection/SelectionBookmark";

export default class EditorCommands {
    constructor(editor) {
        this.editor = editor;
        this._bookmark = null;
        this._commands = { state: {}, exec: {}, value: {} };
        
        let self = this;
        editor.on("PreInit", () => {
            self._dom = editor.dom;
            self._selection = editor.selection;
            self._formatter = editor.formatter;
        });
        this.init(editor);
    }

    init(editor) {
        let dom = this._dom, selection = this._selection, formatter = this._formatter;

        this.addCommands({
            // Add undo manager logic
            "editorEndUndoLevel,editorAddUndoLevel": () => {
                editor.undoManager.add();
            },

            "Cut,Copy,Paste": (command) => {
                let doc = editor.getDoc(), failed;
                try {
                    this.__execNativeCommand(command);
                }
                catch (ex) {
                    failed = true;
                }
                if (command === "paste" && !doc.queryCommandEnabled(command)) {
                    failed = true;
                }

                if (failed || !doc.queryCommandSupported(command)) {
                    let msg = editor.translate("Your browser doesn't support direct access to the clipboard. " +
                                               "Please use the Ctrl+X/C/V keyboard shortcuts instead.");
                    if (Env.mac) {
                        msg = msg.replace(/Ctrl\+/g, "\u2318+");
                    }
                    editor.notificationManager.open({ text: msg, type: "error" });
                }
            },

            "unlink": () => {
                if (selection.isCollapsed()) {
                    let elm = editor.dom.getParent(editor.selection.getStart(), 'a');
                    if (elm) {
                        editor.dom.remove(elm, true);
                    }
                    return;
                }
                formatter.remove("link");
            },

            "JustifyLeft,JustifyCenter,JustifyRight,JustifyFull,JustifyNone": (command) => {
                let align = command.substring(7);
                if (align === "full") {
                    align = "justify";
                }

                // Remove all other alignments first
                ArrUtils.each("left,center,right,justify".split(','), (name) => {
                    if (align !== name) {
                        formatter.remove("align" + name);
                    }
                });

                if (align !== "none") {
                    this.__toggleFormat("align" + align);
                }
            },

            // Override list commands to fix WebKit bug
            "InsertUnorderedList,InsertOrderedList": (command) => {
                let listElm, listParent;
                this.__execNativeCommand(command);
                listElm = dom.getParent(selection.getNode(), "ol,ul");

                if (listElm) {
                    listParent = listElm.parentNode;
                    if (/^(H[1-6]|P|ADDRESS|PRE)$/.test(listParent.nodeName)) {
                        this._bookmark = selection.getBookmark(type);
                        dom.split(listParent, listElm);
                        selection.moveToBookmark(this._bookmark);
                    }
                }
            },

            // Override commands to use the text formatter engine
            "Bold,Italic,Underline,Strikethrough,Superscript,Subscript": (command) => {
                this.__toggleFormat(command);
            },

            // Override commands to use the text formatter engine
            "ForeColor,HiliteColor": (command, ui, value) => {
                this.__toggleFormat(command, value);
            },

            "FontName": (command, ui, value) => {
                FontCommands.fontNameAction(editor, value);
            },
            "FontSize": (command, ui, value) => {
                FontCommands.fontSizeAction(editor, value);
            },

            "RemoveFormat": (command) => {
                formatter.remove(command);
            },

            "editorBlockQuote": () => {
                this.__toggleFormat("blockquote");
            },

            "FormatBlock": (command, ui, value) => {
                return this.__toggleFormat(value || 'p');
            },

            "editorCleanup": () => {
                let bookmark = selection.getBookmark();
                editor.setContent(editor.getContent());
                selection.moveToBookmark(bookmark);
            },

            "editorRemoveNode": (command, ui, value) => {
                let node = value || selection.getNode();
                if (node !== editor.getBody()) {
                    this._bookmark = selection.getBookmark(type);
                    editor.dom.remove(node, true);
                    selection.moveToBookmark(this._bookmark);
                }
            },

            "editorSelectNodeDepth": (command, ui, value) => {
                let counter = 0;
                dom.getParent(selection.getNode(), (node) => {
                    if (node.nodeType === 1 && counter++ === value) {
                        selection.select(node);
                        return false;
                    }
                }, editor.getBody());
            },

            "editorSelectNode": (command, ui, value) => {
                selection.select(value);
            },

            "editorInsertContent": (command, ui, value) => {
                InsertContent.insertAtCaret(editor, value);
            },

            "editorInsertRawHTML": (command, ui, value) => {
                selection.setContent("editor_marker");
                let content = editor.getContent();
                editor.setContent(content.replace(/editor_marker/g, () => value));
            },

            "editorInsertNewLine": (command, ui, value) => {
                InsertNewLine.insert(editor, value);
            },

            "editorToggleFormat": (command, ui, value) => {
                this.__toggleFormat(value);
            },
            "editorSetContent": (command, ui, value) => {
                editor.setContent(value);
            },

            "Indent,Outdent": (command) => {
                IndentOutdent.handle(editor, command);
            },
  
            "InsertHorizontalRule": () => {
                editor.execCommand("editorInsertContent", false, '<hr />');
            },

            "editorToggleVisualAid": () => {
                editor.hasVisual = !editor.hasVisual;
                editor.addVisual();
            },

            "editorReplaceContent": (command, ui, value) => {
                editor.execCommand("editorInsertContent", false, value.replace(/\{\$selection\}/g, selection.getContent({ format: "text" })));
            },

            "editorInsertLink": (command, ui, value) => {
                let anchor;
                if (typeof value === "string") {
                    value = { href: value };
                }

                anchor = dom.getParent(selection.getNode(), 'a');
                value.href = value.href.replace(' ', "%20");
                if (!anchor || !value.href) {
                    formatter.remove("link");
                }
                if (value.href) {
                    formatter.apply("link", value, anchor);
                }
            },

            "selectAll": () => {
                let editingHost = dom.getParent(selection.getStart(), NodeType.isContentEditableTrue);
                if (editingHost) {
                    let rng = dom.createRng();
                    rng.selectNodeContents(editingHost);
                    selection.setRng(rng);
                }
            },

            "delete": () => {
                DeleteCommands.deleteCommand(editor);
            },
            "forwardDelete": () => {
                DeleteCommands.forwardDeleteCommand(editor);
            },
            "editorNewDocument": () => {
                editor.setContent('');
            },
            "InsertLineBreak": (command, ui, value) => {
                InsertBr.insert(editor, value);
                return true;
            }
        });

        let alignStates = this.__alignStates;
        this.addCommands({
            "JustifyLeft": alignStates("alignleft"),
            "JustifyCenter": alignStates("aligncenter"),
            "JustifyRight": alignStates("alignright"),
            "JustifyFull": alignStates("alignjustify"),
            "Bold,Italic,Underline,Strikethrough,Superscript,Subscript": (command) => {
                return this.__isFormatMatch(command);
            },
            "mceBlockQuote": () => {
                return formatter.match("blockquote");
            },
            "Outdent": () => {
                return IndentOutdent.canOutdent(editor);
            },
            "InsertUnorderedList,InsertOrderedList": (command) => {
                let list = dom.getParent(selection.getNode(), "ul,ol");
                return list && (command === "insertunorderedlist" && list.tagName === "UL" ||
                                command === "insertorderedlist" && list.tagName === "OL");
            }
        }, "state");

        this.addCommands({
            Undo: () => {
                editor.undoManager.undo();
            },
            Redo: () => {
                editor.undoManager.redo();
            }
        });

        this.addQueryValueHandler("FontName", () => FontCommands.fontNameQuery(editor), this);
        this.addQueryValueHandler("FontSize", () => FontCommands.fontSizeQuery(editor), this);
    }

    addCommand(command, callback, scope) {
        command = command.toLowerCase();
        this._commands.exec[command] = (command, ui, value, args) => {
            return callback.call(scope || this.editor, ui, value, args);
        };
    }

    addCommands(commandList, type) {
        type = type || "exec";
        ArrUtils.each(commandList, (callback, command) => {
            ArrUtils.each(command.toLowerCase().split(','), (command) => {
                this._commands[type][command] = callback;
            });
        });
    }

    addQueryStateHandler(command, callback, scope) {
        command = command.toLowerCase();
        this._commands.state[command] = () => callback.call(scope || this.editor);
    }

    addQueryValueHandler(command, callback, scope) {
        command = command.toLowerCase();
        this._commands.value[command] = () => callback.call(scope || this.editor);
    }

    execCommand(command, ui, value, args) {
        let editor = this.editor, func, customCommand, state = false;
        if (editor.removed) {
            return;
        }

        if (!/^(editorAddUndoLevel|editorEndUndoLevel|editorBeginUndoLevel|editorRepaint)$/.test(command) && (!args || !args.skipFocus)) {
            editor.focus();
        }
        else {
            SelectionBookmark.restore(editor);
        }

        args = editor.fire("BeforeExecCommand", { command: command, ui: ui, value: value });
        if (args.isDefaultPrevented()) {
            return false;
        }

        customCommand = command.toLowerCase();
        if ((func = this._commands.exec[customCommand])) {
            func(customCommand, ui, value);
            editor.fire("ExecCommand", { command: command, ui: ui, value: value });
            return true;
        }

        ArrUtils.each(editor.plugins, (p) => {
            if (p.execCommand && p.execCommand(command, ui, value)) {
                editor.fire("ExecCommand", { command: command, ui: ui, value: value });
                state = true;
                return false;
            }
        });

        if (state) {
            return state;
        }

        // Theme commands
        if (editor.theme && editor.theme.execCommand && editor.theme.execCommand(command, ui, value)) {
            editor.fire("ExecCommand", { command: command, ui: ui, value: value });
            return true;
        }

        // Browser commands
        try {
            state = editor.getDoc().execCommand(command, ui, value);
        }
        catch (ex) {
            // Ignore old IE errors
        }

        if (state) {
            editor.fire("ExecCommand", { command: command, ui: ui, value: value });
            return true;
        }
        return false;
    }

    hasCustomCommand(command) {
        command = command.toLowerCase();
        return !!this._commands.exec[command];
    }

    queryCommandState(command) {
        let func;
        if (editor.quirks.isHidden() || editor.removed) {
            return;
        }

        command = command.toLowerCase();
        if ((func = this._commands.state[command])) {
            return func(command);
        }

        // Browser commands
        try {
            return this.editor.getDoc().queryCommandState(command);
        }
        catch (ex) {
            // Ignore
        }
        return false;
    }

    queryCommandValue(command) {
        let func;
        if (editor.quirks.isHidden() || editor.removed) {
            return;
        }

        command = command.toLowerCase();
        if ((func = this._commands.value[command])) {
            return func(command);
        }
        // Browser commands
        try {
            return this.editor.getDoc().queryCommandValue(command);
        }
        catch (ex) {
            // Ignore
        }
    }

    queryCommandSupported(command) {
        command = command.toLowerCase();
        if (this._commands.exec[command]) {
            return true;
        }

        // Browser commands
        try {
            return this.editor.getDoc().queryCommandSupported(command);
        }
        catch (ex) {
            // Ignore
        }
        return false;
    }

    __alignStates(name) {
        let dom = this._dom, selection = this._selection, formatter = this._formatter;
        return () => {
            let nodes = selection.isCollapsed() ? [dom.getParent(selection.getNode(), dom.isBlock)] : selection.getSelectedBlocks(),
                matches = Tools.map(nodes, (node) => !!formatter.matchNode(node, name));
            return ArrUtils.indexOf(matches, true) !== -1;
        };
    }

    __execNativeCommand(command, ui, value) {
        if (ui === undefined) {
            ui = false;
        }
        if (value === undefined) {
            value = null;
        }
        return this.editor.getDoc().execCommand(command, ui, value);
    }

    __toggleFormat(name, value) {
        this._formatter.toggle(name, value ? { value: value } : undefined);
        this.editor.nodeChanged();
    }
}