import Option from "../util/Option";
import Env from "../util/Env";
import Tools from "../util/Tools";
import NodeType from "../dom/NodeType";
import DOMUtils from "../dom/DOMUtils";
import TreeWalker from "../dom/TreeWalker";

export default class SelectionUtils {
    static hasAnyRanges(editor) {
        let sel = editor.selection.getSel();
        return sel && sel.rangeCount > 0;
    }

    static hasAllContentsSelected(elm, rng) {
        return Option.liftN([this.__getStartNode(rng), this.__getEndNode(rng)], (startNode, endNode) => {
            let start = Tools.find(this.__getFirstChildren(elm), (elm) => startNode.dom() === elm.dom()),
                end = Tools.find(this.__getLastChildren(elm), (elm) => endNode.dom() === elm.dom());
            return start.isSome() && end.isSome();
        }).getOr(false);
    }

    static moveEndPoint(dom, rng, node, start) {
        let root = node, walker = new TreeWalker(node, root),
            nonEmptyElementsMap = dom.schema.getNonEmptyElements();
        do {
            // Text node
            if (NodeType.isText(node) && Tools.trim(node.nodeValue).length !== 0) {
                if (start) {
                    rng.setStart(node, 0);
                }
                else {
                    rng.setEnd(node, node.nodeValue.length);
                }
                return;
            }

            // BR/IMG/INPUT elements but not table cells
            if (nonEmptyElementsMap[node.nodeName] && !/^(TD|TH)$/.test(node.nodeName)) {
                if (start) {
                    rng.setStartBefore(node);
                }
                else {
                    if (node.nodeName === "BR") {
                        rng.setEndBefore(node);
                    }
                    else {
                        rng.setEndAfter(node);
                    }
                }
                return;
            }

            // Found empty text block old IE can place the selection inside those
            if (Env.ie && Env.ie < 11 && dom.isBlock(node) && dom.isEmpty(node)) {
                if (start) {
                    rng.setStart(node, 0);
                }
                else {
                    rng.setEnd(node, 0);
                }
                return;
            }
        } while ((node = (start ? walker.next() : walker.prev())));

        // Failed to find any text node or other suitable location then move to the root of body
        if (root.nodeName === "BODY") {
            if (start) {
                rng.setStart(root, 0);
            }
            else {
                rng.setEnd(root, root.childNodes.length);
            }
        }
    }

    static __getStartNode(rng) {
        let sc = rng.startContainer, so = rng.startOffset;
        if (NodeType.isText(sc)) {
            return so === 0 ? Option.some(DOMUtils.fromDom(sc)) : Option.none();
        }
        else {
            return Option.from(sc.childNodes[so]).map(DOMUtils.fromDom);
        }
    }

    static __getEndNode(rng) {
        let ec = rng.endContainer, eo = rng.endOffset;
        if (NodeType.isText(ec)) {
            return eo === ec.data.length ? Option.some(DOMUtils.fromDom(ec)) : Option.none();
        }
        else {
            return Option.from(ec.childNodes[eo - 1]).map(DOMUtils.fromDom);
        }
    }

    static __getFirstChildren(node) {
        return DOMUtils.firstChild(node).fold(Option.constant([node]), (child) => {
            return [node].concat(this.__getFirstChildren(child));
        });
    }

    static __getLastChildren(node) {
        return DOMUtils.lastChild(node).fold(Option.constant([node]), (child) => {
            if (DOMUtils.name(child) === "br") {
                return DOMUtils.prevSibling(child).map((sibling) => {
                    return [node].concat(this.__getLastChildren(sibling));
                }).getOr([]);
            }
            else {
                return [node].concat(this.__getLastChildren(child));
            }
        });
    }
}