import Tools from "../util/Tools";
import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";
import ElementType from "../dom/ElementType";
import TrimHtml from "../dom/TrimHtml";
import Node from "../html/Node";
import Zwsp from "../text/Zwsp";
import Settings from "../Settings";

export default class GetContent {
    static getContent(editor, args) {
        if (args === void 0) {
            args = {};
        }
        return Option.from(editor.getBody())
                     .fold(Option.constant(args.format === "tree" ? new Node("body", 11) : ''),
                          (body) => this.__getContentFromBody(editor, args, body));
    }

    static __getContentFromBody(editor, args, body) {
        let content;
        args.format = args.format ? args.format : "html";
        args.get = true;
        args.getInner = true;

        if (!args.noEvents) {
            editor.fire("BeforeGetContent", args);
        }

        if (args.format === "raw") {
            content = Tools.trim(TrimHtml.trimExternal(editor.serializer, body.innerHTML));
        }
        else if (args.format === "text") {
            content = Zwsp.trim(body.innerText || body.textContent);
        }
        else if (args.format === "tree") {
            return editor.serializer.serialize(body, args);
        }
        else {
            let html = editor.serializer.serialize(body, args), blockName = Settings.getForcedRootBlock(editor),
                emptyRegExp = new RegExp("^(<" + blockName + "[^>]*>(&nbsp;|&#160;|\\s|\u00A0|<br \\/>|)<\\/" + blockName + ">[\r\n]*|<br \\/>[\r\n]*)$");
            content = html.replace(emptyRegExp, '');
        }

        if (args.format !== "text" && !ElementType.isWsPreserveElement(DOMUtils.fromDom(body))) {
            args.content = Tools.trim(content);
        }
        else {
            args.content = content;
        }
        if (!args.noEvents) {
            editor.fire("GetContent", args);
        }

        return args.content;
    }
}