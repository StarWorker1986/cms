import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";
import EventProcessRanges from "./EventProcessRanges";
import FragmentReader from "./FragmentReader";
import MultiRange from "./MultiRange";
import Zwsp from "../text/Zwsp";

export default class GetSelectionContent {
    static getContent(editor, args) {
        if (args === void 0) {
            args = {};
        }

        args.get = true;
        args.format = args.format || "html";
        args.selection = true;
        args = editor.fire("BeforeGetContent", args);

        if (args.isDefaultPrevented()) {
            editor.fire("GetContent", args);
            return args.content;
        }
        
        if (args.format === "text") {
            return this.__getTextContent(editor);
        }
        else {
            args.getInner = true;
            let content = this.__getHtmlContent(editor, args);
            if (args.format === "tree") {
                return content;
            }
            else {
                args.content = editor.selection.isCollapsed() ? '' : content;
                editor.fire("GetContent", args);
                return args.content;
            }
        }
    }

    static __getTextContent(editor) {
        return Option.from(editor.selection.getRng()).map((rng) => {
            let bin = editor.dom.add(editor.getBody(), "div", {
                "data-editor-bogus": "all",
                "style": "overflow: hidden; opacity: 0;"
            }, rng.cloneContents()), text = Zwsp.trim(bin.innerText);
            
            editor.dom.remove(bin);
            return text;
        }).getOr('');
    }

    static __getHtmlContent(editor, args) {
        let rng = editor.selection.getRng(), tmpElm = editor.dom.create("body"),
            sel = editor.selection.getSel(), fragment,
            ranges = EventProcessRanges.processRanges(editor, MultiRange.getRanges(sel));

        fragment = args.contextual ? FragmentReader.read(DOMUtils.fromDom(editor.getBody()), ranges).dom() : rng.cloneContents();
        if (fragment) {
            tmpElm.appendChild(fragment);
        }

        return editor.selection.serializer.serialize(tmpElm, args);
    }
}