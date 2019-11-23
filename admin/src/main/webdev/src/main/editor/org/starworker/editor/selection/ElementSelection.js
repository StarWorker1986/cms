import Option from "../util/Option";
import NodeType from "../dom/NodeType";
import DOMUtils from "../dom/DOMUtils";
import TreeWalker from "../dom/TreeWalker";
import SelectionUtils from "./SelectionUtils";

export default class ElementSelection {
    static getStart(root, rng, real) {
        return this.__getEndpointElement(root, rng, true, real, (elm, offset) => Math.min(DOMUtils.childNodesCount(elm), offset));
    }

    static getEnd(root, rng, real) {
        return this.__getEndpointElement(root, rng, false, real, (elm, offset) => offset > 0 ? offset - 1 : offset);
    }

    static getNode(root, rng) {
        let elm, startContainer, endContainer, startOffset, endOffset;

        // Range maybe lost after the editor is made visible again
        if (!rng) {
            return root;
        }

        startContainer = rng.startContainer;
        endContainer = rng.endContainer;
        startOffset = rng.startOffset;
        endOffset = rng.endOffset;
        elm = rng.commonAncestorContainer;

        // Handle selection a image or other control like element such as anchors
        if (!rng.collapsed) {
            if (startContainer === endContainer) {
                if (endOffset - startOffset < 2) {
                    if (startContainer.hasChildNodes()) {
                        elm = startContainer.childNodes[startOffset];
                    }
                }
            }

            if (startContainer.nodeType === 3 && endContainer.nodeType === 3) {
                if (startContainer.length === startOffset) {
                    startContainer = this.__skipEmptyTextNodes(startContainer.nextSibling, true);
                }
                else {
                    startContainer = startContainer.parentNode;
                }
                if (endOffset === 0) {
                    endContainer = this.__skipEmptyTextNodes(endContainer.previousSibling, false);
                }
                else {
                    endContainer = endContainer.parentNode;
                }
                if (startContainer && startContainer === endContainer) {
                    return startContainer;
                }
            }
        }
        if (elm && elm.nodeType === 3) {
            return elm.parentNode;
        }
        return elm;
    }

    static getSelectedBlocks(dom, rng, startElm, endElm) {
        let node, root, selectedBlocks = [];

        root = dom.getRoot();
        startElm = dom.getParent(startElm || this.getStart(root, rng, rng.collapsed), dom.isBlock);
        endElm = dom.getParent(endElm || this.getEnd(root, rng, rng.collapsed), dom.isBlock);
        if (startElm && startElm !== root) {
            selectedBlocks.push(startElm);
        }

        if (startElm && endElm && startElm !== endElm) {
            node = startElm;
            let walker = new TreeWalker(startElm, root);
            while ((node = walker.next()) && node !== endElm) {
                if (dom.isBlock(node)) {
                    selectedBlocks.push(node);
                }
            }
        }

        if (endElm && startElm !== endElm && endElm !== root) {
            selectedBlocks.push(endElm);
        }

        return selectedBlocks;
    }

    static select(dom, node, content) {
        return Option.from(node).map((node) => {
            let idx = dom.nodeIndex(node), rng = dom.createRng();

            rng.setStart(node.parentNode, idx);
            rng.setEnd(node.parentNode, idx + 1);
            
            // Find first/last text node or BR element
            if (content) {
                SelectionUtils.moveEndPoint(dom, rng, node, true);
                SelectionUtils.moveEndPoint(dom, rng, node, false);
            }

            return rng;
        });
    }

    static __getEndpointElement(root, rng, start, real, resolve) {
        let container = start ? rng.startContainer : rng.endContainer,
            offset = start ? rng.startOffset : rng.endOffset;

        return Option.from(container).map(DOMUtils.fromDom)
        .map((elm) => {
            return !real || !rng.collapsed ? DOMUtils.child(elm, resolve(elm, offset)).getOr(elm) : elm;
        })
        .bind((elm) => { 
            return NodeType.isElement(elm.dom()) ? Option.some(elm) : DOMUtils.parent(elm); 
        })
        .map((elm) => { 
            return elm.dom(); 
        }).getOr(root);
    }

    static __skipEmptyTextNodes(node, forwards) {
        let orig = node;
        while (node && NodeType.isText(node) && node.length === 0) {
            node = forwards ? node.nextSibling : node.previousSibling;
        }
        return node || orig;
    }
}
