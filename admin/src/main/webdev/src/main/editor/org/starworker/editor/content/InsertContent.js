import Option from "../util/Option";
import Env from "../util/Env";
import DOMUtils from "../dom/DOMUtils";
import InsertList from "./InsertList";
import CaretPosition from "../caret/CaretPosition";
import CaretWalker from "../caret/CaretWalker";
import ElementUtils from "../dom/ElementUtils";
import NodeType from "../dom/NodeType";
import PaddingBr from "../dom/PaddingBr";
import Serializer from "../html/Serializer";
import RangeNormalizer from "../selection/RangeNormalizer";
import Tools from "../util/Tools";
import NbspTrim from "./NbspTrim";

export default class InsertContent {
    static insertAtCaret(editor, value) {
        let result = this.__processValue(value);
        this.__insertHtmlAtCaret(editor, result.content, result.details);
    }

    static __canHaveChildren(editor, node) {
        return node && !editor.schema.getShortEndedElements()[node.nodeName];
    }

    static __findNextCaretRng(editor, rng) {
        let caretPos = CaretPosition.fromRangeStart(rng), caretWalker = new CaretWalker(editor.getBody());
        caretPos = caretWalker.next(caretPos);
        if (caretPos) {
            return caretPos.toRange();
        }
    }

    static __getContentEditableFalseParent(editor, node) {
        let root = editor.getBody();
        for (; node && node !== root; node = node.parentNode) {
            if (editor.dom.getContentEditable(node) === "false") {
                return node;
            }
        }
        return null;
    }

    static __insertHtmlAtCaret(editor, value, details) {
        let parser, serializer, parentNode, rootNode, fragment, args, parserArgs,
            marker, rng, node, bookmarkHtml, merge, caretElement, body,
            selection = editor.selection, dom = editor.dom;

        // Check for whitespace before/after value
        if (/^ | $/.test(value)) {
            value = NbspTrim.trimOrPadLeftRight(selection.getRng(), value);
        }

        // Setup parser and serializer
        parser = editor.parser;
        merge = details.merge;
        serializer = new Serializer({
            validate: editor.settings.validate
        }, editor.schema);
        bookmarkHtml = '<span id="editor_marker" data-editor-type="bookmark">&#xFEFF;&#x200B;</span>';

        // Run beforeSetContent handlers on the HTML to be inserted
        args = { content: value, format: "html", selection: true, paste: details.paste };
        args = editor.fire("BeforeSetContent", args);
        if (args.isDefaultPrevented()) {
            editor.fire("SetContent", { content: args.content, format: "html", selection: true, paste: details.paste });
            return;
        }
        value = args.content;

        // Add caret at end of contents if it"s missing
        if (value.indexOf("{$caret}") === -1) {
            value += "{$caret}";
        }

        // Replace the caret marker with a span bookmark element
        value = value.replace(/\{\$caret\}/, bookmarkHtml);
        
        // If selection is at <body>|<p></p> then move it into <body><p>|</p>
        rng = selection.getRng();
        caretElement = rng.startContainer || (rng.parentElement ? rng.parentElement() : null);
        body = editor.getBody();
        
        if (caretElement === body && selection.isCollapsed()) {
            if (dom.isBlock(body.firstChild) && this.__canHaveChildren(editor, body.firstChild)
                                             && dom.isEmpty(body.firstChild)) {
                rng = dom.createRng();
                rng.setStart(body.firstChild, 0);
                rng.setEnd(body.firstChild, 0);
                selection.setRng(rng);
            }
        }

        if (!selection.isCollapsed()) {
            // Fix for #2595 seems that delete removes one extra character on
            // WebKit for some odd reason if you double click select a word
            editor.selection.setRng(RangeNormalizer.normalize(editor.selection.getRng()));
            editor.getDoc().execCommand("Delete", false, null);
            value = NbspTrim.trimNbspAfterDeleteAndPadValue(editor.selection.getRng(), value);
        }

        parentNode = selection.getNode();
        parserArgs = { context: parentNode.nodeName.toLowerCase(), data: details.data, insert: true };
        fragment = parser.parse(value, parserArgs);

        if (details.paste === true && InsertList.isListFragment(editor.schema, fragment)
                                   && InsertList.isParentBlockLi(dom, parentNode)) {
            rng = InsertList.insertAtCaret(serializer, dom, editor.selection.getRng(), fragment);
            editor.selection.setRng(rng);
            editor.fire("SetContent", args);
            return;
        }

        this.__markFragmentElements(fragment);
        node = fragment.lastChild;

        if (node.attr("id") === "editor_marker") {
            marker = node;
            for (node = node.prev; node; node = node.walk(true)) {
                if (node.type === 3 || !dom.isBlock(node.name)) {
                    if (editor.schema.isValidChild(node.parent.name, "span")) {
                        node.parent.insert(marker, node, node.name === "br");
                    }
                    break;
                }
            }
        }

        editor._selectionOverrides.showBlockCaretContainer(parentNode);
        if (!parserArgs.invalid) {
            value = serializer.serialize(fragment);
            this.__validInsertion(editor, value, parentNode);
        }
        else {
            this.__selectionSetContent(editor, bookmarkHtml);
            parentNode = selection.getNode();
            rootNode = editor.getBody();

            if (parentNode.nodeType === 9) {
                parentNode = node = rootNode;
            }
            else {
                node = parentNode;
            }
            while (node !== rootNode) {
                parentNode = node;
                node = node.parentNode;
            }

            value = parentNode === rootNode ? rootNode.innerHTML : dom.getOuterHTML(parentNode);
            value = serializer.serialize(parser.parse(
            value.replace(/<span (id="editor_marker"|id=editor_marker).+?<\/span>/i, () => serializer.serialize(fragment))));
            if (parentNode === rootNode) {
                dom.setHTML(rootNode, value);
            }
            else {
                dom.setOuterHTML(parentNode, value);
            }
        }

        this.__reduceInlineTextElements(editor, merge);
        this.__moveSelectionToMarker(editor, dom.get("mce_marker"));
        this.__umarkFragmentElements(editor.getBody());
        this.__trimBrsFromTableCell(editor.dom, editor.selection.getStart());
        editor.fire("SetContent", args);
        editor.addVisual();
    }

    static __markFragmentElements(fragment) {
        let node = fragment;
        while ((node = node.walk())) {
            if (node.type === 1) {
                node.attr("data-editor-fragment", "1");
            }
        }
    }

    static __moveSelectionToMarker(editor, marker) {
        let parentEditableFalseElm, parentBlock, nextRng,
            dom = editor.dom, selection = editor.selection,
            node, node2, isTableCell = NodeType.matchNodeNames("td th");

        if (!marker) {
            return;
        }

        editor.selection.scrollIntoView(marker);
        parentEditableFalseElm = this.__getContentEditableFalseParent(editor, marker);
        if (parentEditableFalseElm) {
            dom.remove(marker);
            selection.select(parentEditableFalseElm);
            return;
        }

        let rng = dom.createRng();
        node = marker.previousSibling;
        if (node && node.nodeType === 3) {
            rng.setStart(node, node.nodeValue.length);
            if (!Env.ie) {
                node2 = marker.nextSibling;
                if (node2 && node2.nodeType === 3) {
                    node.appendData(node2.data);
                    node2.parentNode.removeChild(node2);
                }
            }
        }
        else {
            rng.setStartBefore(marker);
            rng.setEndBefore(marker);
        }

        parentBlock = dom.getParent(marker, dom.isBlock);
        dom.remove(marker);
        if (parentBlock && dom.isEmpty(parentBlock)) {
            DOMUtils.$(parentBlock).empty();
            rng.setStart(parentBlock, 0);
            rng.setEnd(parentBlock, 0);
            if (!isTableCell(parentBlock) && !parentBlock.getAttribute("data-editor-fragment")
                                          && (nextRng = this.__findNextCaretRng(rng))) {
                rng = nextRng;
                dom.remove(parentBlock);
            }
            else {
                dom.add(parentBlock, dom.create("br", { "data-editor-bogus": "1" }));
            }
        }
        selection.setRng(rng);
    }

    static __processValue(value) {
        let details;
        if (typeof value !== "string") {
            details = Tools.extend({
                paste: value.paste,
                data: {
                    paste: value.paste
                }
            }, value);
            return {
                content: value.content,
                details: details
            };
        }
        return {
            content: value,
            details: {}
        };
    }

    static __reduceInlineTextElements(editor, merge) {
        let textInlineElements = editor.schema.getTextInlineElements(), dom = editor.dom;
        if (merge) {
            let root = editor.getBody(), elementUtils = new ElementUtils(dom);
            Tools.each(dom.select("*[data-editor-fragment]"), (node) => {
                for (let testNode = node.parentNode; testNode && testNode !== root; testNode = testNode.parentNode) {
                    if (textInlineElements[node.nodeName.toLowerCase()] && elementUtils.compare(testNode, node)) {
                        dom.remove(node, true);
                    }
                }
            });
        }
    }

    static __selectionSetContent(editor, content) {
        let rng = editor.selection.getRng(), container = rng.startContainer, offset = rng.startOffset;
        if (rng.collapsed && NbspTrim.isAfterNbsp(container, offset) && NodeType.isText(container)) {
            container.insertData(offset - 1, ' ');
            container.deleteData(offset, 1);
            rng.setStart(container, offset);
            rng.setEnd(container, offset);
            editor.selection.setRng(rng);
        }
        editor.selection.setContent(content);
    }

    static __trimBrsFromTableCell(dom, elm) {
        Option.from(dom.getParent(elm, "td,th")).map(DOMUtils.fromDom).each(PaddingBr.trimBlockTrailingBr);
    }

    static __umarkFragmentElements(elm) {
        Tools.each(elm.getElementsByTagName('*'), (elm) => {
            elm.removeAttribute("data-editor-fragment");
        });
    }

    static __validInsertion(editor, value, parentNode) {
        if (parentNode.getAttribute("data-editor-bogus") === "all") {
            parentNode.parentNode.insertBefore(editor.dom.createFragment(value), parentNode);
        }
        else {
            let node = parentNode.firstChild, node2 = parentNode.lastChild;
            if (!node || (node === node2 && node.nodeName === "BR")) {
                editor.dom.setHTML(parentNode, value);
            }
            else {
                this.__selectionSetContent(editor, value);
            }
        }
    }
}