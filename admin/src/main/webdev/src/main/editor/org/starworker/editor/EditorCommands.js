import Env from './util/Env';
import InsertContent from '../content/InsertContent';
import DeleteCommands from '../delete/DeleteCommands';
import * as FontCommands from '../commands/FontCommands';
import NodeType from '../dom/NodeType';
import InsertBr from '../newline/InsertBr';
import SelectionBookmark from '../selection/SelectionBookmark';
import Tools from './util/Tools';
import * as IndentOutdent from 'tinymce/core/commands/IndentOutdent';
import InsertNewLine from '../newline/InsertNewLine';
/**
 * This class enables you to add custom editor commands and it contains
 * overrides for native browser commands to address various bugs and issues.
 *
 * @class tinymce.EditorCommands
 */
// Added for compression purposes
var each = Tools.each, extend = Tools.extend;
var map = Tools.map, inArray = Tools.inArray;
export default function (editor) {
    var dom, selection, formatter;
    var commands = { state: {}, exec: {}, value: {} };
    var bookmark;
    editor.on('PreInit', function () {
        dom = editor.dom;
        selection = editor.selection;
        formatter = editor.formatter;
    });
    /**
     * Executes the specified command.
     *
     * @method execCommand
     * @param {String} command Command to execute.
     * @param {Boolean} ui Optional user interface state.
     * @param {Object} value Optional value for command.
     * @param {Object} args Optional extra arguments to the execCommand.
     * @return {Boolean} true/false if the command was found or not.
     */
    var execCommand = function (command, ui, value, args) {
        var func, customCommand, state = false;
        if (editor.removed) {
            return;
        }
        if (!/^(mceAddUndoLevel|mceEndUndoLevel|mceBeginUndoLevel|mceRepaint)$/.test(command) && (!args || !args.skip_focus)) {
            editor.focus();
        }
        else {
            SelectionBookmark.restore(editor);
        }
        args = editor.fire('BeforeExecCommand', { command: command, ui: ui, value: value });
        if (args.isDefaultPrevented()) {
            return false;
        }
        customCommand = command.toLowerCase();
        if ((func = commands.exec[customCommand])) {
            func(customCommand, ui, value);
            editor.fire('ExecCommand', { command: command, ui: ui, value: value });
            return true;
        }
        // Plugin commands
        each(editor.plugins, function (p) {
            if (p.execCommand && p.execCommand(command, ui, value)) {
                editor.fire('ExecCommand', { command: command, ui: ui, value: value });
                state = true;
                return false;
            }
        });
        if (state) {
            return state;
        }
        // Theme commands
        if (editor.theme && editor.theme.execCommand && editor.theme.execCommand(command, ui, value)) {
            editor.fire('ExecCommand', { command: command, ui: ui, value: value });
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
            editor.fire('ExecCommand', { command: command, ui: ui, value: value });
            return true;
        }
        return false;
    };
    /**
     * Queries the current state for a command for example if the current selection is "bold".
     *
     * @method queryCommandState
     * @param {String} command Command to check the state of.
     * @return {Boolean/Number} true/false if the selected contents is bold or not, -1 if it's not found.
     */
    var queryCommandState = function (command) {
        var func;
        if (editor.quirks.isHidden() || editor.removed) {
            return;
        }
        command = command.toLowerCase();
        if ((func = commands.state[command])) {
            return func(command);
        }
        // Browser commands
        try {
            return editor.getDoc().queryCommandState(command);
        }
        catch (ex) {
            // Fails sometimes see bug: 1896577
        }
        return false;
    };
    /**
     * Queries the command value for example the current fontsize.
     *
     * @method queryCommandValue
     * @param {String} command Command to check the value of.
     * @return {Object} Command value of false if it's not found.
     */
    var queryCommandValue = function (command) {
        var func;
        if (editor.quirks.isHidden() || editor.removed) {
            return;
        }
        command = command.toLowerCase();
        if ((func = commands.value[command])) {
            return func(command);
        }
        // Browser commands
        try {
            return editor.getDoc().queryCommandValue(command);
        }
        catch (ex) {
            // Fails sometimes see bug: 1896577
        }
    };
    /**
     * Adds commands to the command collection.
     *
     * @method addCommands
     * @param {Object} commandList Name/value collection with commands to add, the names can also be comma separated.
     * @param {String} type Optional type to add, defaults to exec. Can be value or state as well.
     */
    var addCommands = function (commandList, type) {
        type = type || 'exec';
        each(commandList, function (callback, command) {
            each(command.toLowerCase().split(','), function (command) {
                commands[type][command] = callback;
            });
        });
    };
    var addCommand = function (command, callback, scope) {
        command = command.toLowerCase();
        commands.exec[command] = function (command, ui, value, args) {
            return callback.call(scope || editor, ui, value, args);
        };
    };
    /**
     * Returns true/false if the command is supported or not.
     *
     * @method queryCommandSupported
     * @param {String} command Command that we check support for.
     * @return {Boolean} true/false if the command is supported or not.
     */
    var queryCommandSupported = function (command) {
        command = command.toLowerCase();
        if (commands.exec[command]) {
            return true;
        }
        // Browser commands
        try {
            return editor.getDoc().queryCommandSupported(command);
        }
        catch (ex) {
            // Fails sometimes see bug: 1896577
        }
        return false;
    };
    var addQueryStateHandler = function (command, callback, scope) {
        command = command.toLowerCase();
        commands.state[command] = function () {
            return callback.call(scope || editor);
        };
    };
    var addQueryValueHandler = function (command, callback, scope) {
        command = command.toLowerCase();
        commands.value[command] = function () {
            return callback.call(scope || editor);
        };
    };
    var hasCustomCommand = function (command) {
        command = command.toLowerCase();
        return !!commands.exec[command];
    };
    // Expose public methods
    extend(this, {
        execCommand: execCommand,
        queryCommandState: queryCommandState,
        queryCommandValue: queryCommandValue,
        queryCommandSupported: queryCommandSupported,
        addCommands: addCommands,
        addCommand: addCommand,
        addQueryStateHandler: addQueryStateHandler,
        addQueryValueHandler: addQueryValueHandler,
        hasCustomCommand: hasCustomCommand
    });
    // Private methods
    var execNativeCommand = function (command, ui, value) {
        if (ui === undefined) {
            ui = false;
        }
        if (value === undefined) {
            value = null;
        }
        return editor.getDoc().execCommand(command, ui, value);
    };
    var isFormatMatch = function (name) {
        return formatter.match(name);
    };
    var toggleFormat = function (name, value) {
        formatter.toggle(name, value ? { value: value } : undefined);
        editor.nodeChanged();
    };
    var storeSelection = function (type) {
        bookmark = selection.getBookmark(type);
    };
    var restoreSelection = function () {
        selection.moveToBookmark(bookmark);
    };
    // Add execCommand overrides
    addCommands({
        // Ignore these, added for compatibility
        'mceResetDesignMode,mceBeginUndoLevel': function () { },
        // Add undo manager logic
        'mceEndUndoLevel,mceAddUndoLevel': function () {
            editor.undoManager.add();
        },
        'Cut,Copy,Paste': function (command) {
            var doc = editor.getDoc();
            var failed;
            // Try executing the native command
            try {
                execNativeCommand(command);
            }
            catch (ex) {
                // Command failed
                failed = true;
            }
            // Chrome reports the paste command as supported however older IE:s will return false for cut/paste
            if (command === 'paste' && !doc.queryCommandEnabled(command)) {
                failed = true;
            }
            // Present alert message about clipboard access not being available
            if (failed || !doc.queryCommandSupported(command)) {
                var msg = editor.translate('Your browser doesn\'t support direct access to the clipboard. ' +
                    'Please use the Ctrl+X/C/V keyboard shortcuts instead.');
                if (Env.mac) {
                    msg = msg.replace(/Ctrl\+/g, '\u2318+');
                }
                editor.notificationManager.open({ text: msg, type: 'error' });
            }
        },
        // Override unlink command
        'unlink': function () {
            if (selection.isCollapsed()) {
                var elm = editor.dom.getParent(editor.selection.getStart(), 'a');
                if (elm) {
                    editor.dom.remove(elm, true);
                }
                return;
            }
            formatter.remove('link');
        },
        // Override justify commands to use the text formatter engine
        'JustifyLeft,JustifyCenter,JustifyRight,JustifyFull,JustifyNone': function (command) {
            var align = command.substring(7);
            if (align === 'full') {
                align = 'justify';
            }
            // Remove all other alignments first
            each('left,center,right,justify'.split(','), function (name) {
                if (align !== name) {
                    formatter.remove('align' + name);
                }
            });
            if (align !== 'none') {
                toggleFormat('align' + align);
            }
        },
        // Override list commands to fix WebKit bug
        'InsertUnorderedList,InsertOrderedList': function (command) {
            var listElm, listParent;
            execNativeCommand(command);
            // WebKit produces lists within block elements so we need to split them
            // we will replace the native list creation logic to custom logic later on
            // TODO: Remove this when the list creation logic is removed
            listElm = dom.getParent(selection.getNode(), 'ol,ul');
            if (listElm) {
                listParent = listElm.parentNode;
                // If list is within a text block then split that block
                if (/^(H[1-6]|P|ADDRESS|PRE)$/.test(listParent.nodeName)) {
                    storeSelection();
                    dom.split(listParent, listElm);
                    restoreSelection();
                }
            }
        },
        // Override commands to use the text formatter engine
        'Bold,Italic,Underline,Strikethrough,Superscript,Subscript': function (command) {
            toggleFormat(command);
        },
        // Override commands to use the text formatter engine
        'ForeColor,HiliteColor': function (command, ui, value) {
            toggleFormat(command, value);
        },
        'FontName': function (command, ui, value) {
            FontCommands.fontNameAction(editor, value);
        },
        'FontSize': function (command, ui, value) {
            FontCommands.fontSizeAction(editor, value);
        },
        'RemoveFormat': function (command) {
            formatter.remove(command);
        },
        'mceBlockQuote': function () {
            toggleFormat('blockquote');
        },
        'FormatBlock': function (command, ui, value) {
            return toggleFormat(value || 'p');
        },
        'mceCleanup': function () {
            var bookmark = selection.getBookmark();
            editor.setContent(editor.getContent());
            selection.moveToBookmark(bookmark);
        },
        'mceRemoveNode': function (command, ui, value) {
            var node = value || selection.getNode();
            // Make sure that the body node isn't removed
            if (node !== editor.getBody()) {
                storeSelection();
                editor.dom.remove(node, true);
                restoreSelection();
            }
        },
        'mceSelectNodeDepth': function (command, ui, value) {
            var counter = 0;
            dom.getParent(selection.getNode(), function (node) {
                if (node.nodeType === 1 && counter++ === value) {
                    selection.select(node);
                    return false;
                }
            }, editor.getBody());
        },
        'mceSelectNode': function (command, ui, value) {
            selection.select(value);
        },
        'mceInsertContent': function (command, ui, value) {
            InsertContent.insertAtCaret(editor, value);
        },
        'mceInsertRawHTML': function (command, ui, value) {
            selection.setContent('tiny_mce_marker');
            var content = editor.getContent();
            editor.setContent(content.replace(/tiny_mce_marker/g, function () { return value; }));
        },
        'mceInsertNewLine': function (command, ui, value) {
            InsertNewLine.insert(editor, value);
        },
        'mceToggleFormat': function (command, ui, value) {
            toggleFormat(value);
        },
        'mceSetContent': function (command, ui, value) {
            editor.setContent(value);
        },
        'Indent,Outdent': function (command) {
            IndentOutdent.handle(editor, command);
        },
        'mceRepaint': function () {
        },
        'InsertHorizontalRule': function () {
            editor.execCommand('mceInsertContent', false, '<hr />');
        },
        'mceToggleVisualAid': function () {
            editor.hasVisual = !editor.hasVisual;
            editor.addVisual();
        },
        'mceReplaceContent': function (command, ui, value) {
            editor.execCommand('mceInsertContent', false, value.replace(/\{\$selection\}/g, selection.getContent({ format: 'text' })));
        },
        'mceInsertLink': function (command, ui, value) {
            var anchor;
            if (typeof value === 'string') {
                value = { href: value };
            }
            anchor = dom.getParent(selection.getNode(), 'a');
            // Spaces are never valid in URLs and it's a very common mistake for people to make so we fix it here.
            value.href = value.href.replace(' ', '%20');
            // Remove existing links if there could be child links or that the href isn't specified
            if (!anchor || !value.href) {
                formatter.remove('link');
            }
            // Apply new link to selection
            if (value.href) {
                formatter.apply('link', value, anchor);
            }
        },
        'selectAll': function () {
            var editingHost = dom.getParent(selection.getStart(), NodeType.isContentEditableTrue);
            if (editingHost) {
                var rng = dom.createRng();
                rng.selectNodeContents(editingHost);
                selection.setRng(rng);
            }
        },
        'delete': function () {
            DeleteCommands.deleteCommand(editor);
        },
        'forwardDelete': function () {
            DeleteCommands.forwardDeleteCommand(editor);
        },
        'mceNewDocument': function () {
            editor.setContent('');
        },
        'InsertLineBreak': function (command, ui, value) {
            InsertBr.insert(editor, value);
            return true;
        }
    });
    var alignStates = function (name) { return function () {
        var nodes = selection.isCollapsed() ? [dom.getParent(selection.getNode(), dom.isBlock)] : selection.getSelectedBlocks();
        var matches = map(nodes, function (node) {
            return !!formatter.matchNode(node, name);
        });
        return inArray(matches, true) !== -1;
    }; };
    // Add queryCommandState overrides
    addCommands({
        // Override justify commands
        'JustifyLeft': alignStates('alignleft'),
        'JustifyCenter': alignStates('aligncenter'),
        'JustifyRight': alignStates('alignright'),
        'JustifyFull': alignStates('alignjustify'),
        'Bold,Italic,Underline,Strikethrough,Superscript,Subscript': function (command) {
            return isFormatMatch(command);
        },
        'mceBlockQuote': function () {
            return isFormatMatch('blockquote');
        },
        'Outdent': function () {
            return IndentOutdent.canOutdent(editor);
        },
        'InsertUnorderedList,InsertOrderedList': function (command) {
            var list = dom.getParent(selection.getNode(), 'ul,ol');
            return list &&
                (command === 'insertunorderedlist' && list.tagName === 'UL' ||
                    command === 'insertorderedlist' && list.tagName === 'OL');
        }
    }, 'state');
    // Add undo manager logic
    addCommands({
        Undo: function () {
            editor.undoManager.undo();
        },
        Redo: function () {
            editor.undoManager.redo();
        }
    });
    addQueryValueHandler('FontName', function () { return FontCommands.fontNameQuery(editor); }, this);
    addQueryValueHandler('FontSize', function () { return FontCommands.fontSizeQuery(editor); }, this);
}