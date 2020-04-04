import Tools from "../util/Tools";
import Option from "../util/Option";
import NodeType from "../dom/NodeType";
import DOMUtils from "../dom/DOMUtils";
import ElementType from "../dom/ElementType";
import Node from "../html/Node";
import Serializer from "../html/Serializer";
import FilterNode from "../html/FilterNode";
import Settings from "../Settings";
import EditorFocus from "../focus/EditorFocus";
import CaretFinder from "../caret/CaretFinder";

export default class SetContent {
    static setContent(editor, content, args) {
        if (args === void 0) {
            args = {};
        }
        args.format = args.format ? args.format : "html";
        args.set = true;
        args.content = this.__isTreeNode(content) ? '' : content;

        if (!this.__isTreeNode(content) && !args.noEvents) {
            editor.fire("BeforeSetContent", args);
            content = args.content;
        }
        return Option.from(editor.getBody())
                     .fold(Option.constant(content),
                          (body) => this.__isTreeNode(content) ? this.__setContentTree(editor, body, content, args)
                                                               : this.__setContentString(editor, body, content, args));
    }

    static __setContentTree(editor, body, content, args) {
        FilterNode.filter(editor.parser.getNodeFilters(), editor.parser.getAttributeFilters(), content);
        
        let html = new Serializer({ validate: editor.validate }, editor.schema).serialize(content);
        args.content = ElementType.isWsPreserveElement(DOMUtils.fromDom(body)) ? html : Tools.trim(html);
        this.__setEditorHtml(editor, args.content);
        if (!args.noEvents) {
            editor.fire("SetContent", args);
        }
        return content;
    }

    static __setContentString(editor, body, content, args) {
        let forcedRootBlockName, padd;
       
        if (content.length === 0 || /^\s+$/.test(content)) {
            padd = '<br data-editor-bogus="1">';
           
            if (body.nodeName === "TABLE") {
                content = "<tr><td>" + padd + "</td></tr>";
            }
            else if (/^(UL|OL)$/.test(body.nodeName)) {
                content = "<li>" + padd + "</li>";
            }

            forcedRootBlockName = Settings.getForcedRootBlock(editor);
            if (forcedRootBlockName && editor.schema.isValidChild(body.nodeName.toLowerCase(), forcedRootBlockName.toLowerCase())) {
                content = padd;
                content = editor.dom.createHTML(forcedRootBlockName, editor.settings.forcedRootBlockAttrs, content);
            }
            else if (!content) {
                content = '<br data-editor-bogus="1">';
            }
            this.__setEditorHtml(editor, content);
            editor.fire("SetContent", args);
        }
        else {
            if (args.format !== "raw") {
                content = new Serializer({
                    validate: editor.validate
                }, editor.schema).serialize(editor.parser.parse(content, { isRootContent: true, insert: true }));
            }
            args.content = ElementType.isWsPreserveElement(DOMUtils.fromDom(body)) ? content : Tools.trim(content);
            this.__setEditorHtml(editor, args.content);
            if (!args.noEvents) {
                editor.fire("SetContent", args);
            }
        }

        return args.content;
    }

    static __setEditorHtml(editor, html) {
        editor.dom.setHTML(editor.getBody(), html);
        this.__moveSelection(editor);
    }

    static __moveSelection(editor) {
        if (EditorFocus.hasFocus(editor)) {
            CaretFinder.firstPositionIn(editor.getBody()).each((pos) => {
                let node = pos.getNode(),
                    caretPos = NodeType.isTable(node) ? CaretFinder.firstPositionIn(node).getOr(pos) : pos;
                editor.selection.setRng(caretPos.toRange());
            });
        }
    }

    static __isTreeNode(content) {
        return content instanceof Node;
    }
}