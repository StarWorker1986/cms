import DOMUtils from "../dom/DOMUtils";
import FormatContainer from "../fmt/FormatContainer";
import FormatUtils from "../fmt/FormatUtils";
import Identification from "./Identification";

export default class AnnotationContext {
    static context(editor, elem, wrapName, nodeName) {
        return DOMUtils.parent(elem).fold(() => "skipping", (parent) => {
            // We used to skip these, but given that they might be representing empty paragraphs, it probably
            // makes sense to treat them just like text nodes
            let isZeroWidth = NodeType.isText(elem.dom()) && elem.dom().nodeValue === '\uFEFF';

            if (nodeName === "br" || isZeroWidth) {
                return "valid";
            }
            else if (Identification.isAnnotation(elem)) {
                return "existing";
            }
            else if (FormatContainer.isCaretNode(elem)) {
                return "caret";
            }
            else if (!FormatUtils.isValid(editor, wrapName, nodeName) || !FormatUtils.isValid(editor, parent.dom().nodeName.toLowerCase(), wrapName)) {
                return "invalid-child";
            }
            else {
                return "valid";
            }
        });
    }
}