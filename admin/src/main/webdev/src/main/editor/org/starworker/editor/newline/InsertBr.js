import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";
import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import NodeType from "../dom/NodeType";
import TreeWalker from "../dom/TreeWalker";
import BoundaryLocation from "../keyboard/BoundaryLocation";
import InlineUtils from "../keyboard/InlineUtils";
import NormalizeRange from "../selection/NormalizeRange";
import RangeInsertNode from "../selection/RangeInsertNode";

export default class InsertBr {
    static insert(editor, evt) {
        let anchorLocation = this.__readInlineAnchorLocation(editor);
        if (anchorLocation.isSome()) {
            anchorLocation.each((location) => this.__insertBrOutsideAnchor(editor, location));
        }
        else {
            this.__insertBrAtCaret(editor, evt);
        }
    }

    static __hasBrAfter(rootNode, startNode) {
        if (NodeType.isBr(CaretPosition.after(startNode).getNode())) {
            return true;
        }
        else {
            return CaretFinder.nextPosition(rootNode, CaretPosition.after(startNode))
                              .map((pos) => NodeType.isBr(pos.getNode())).getOr(false);
        }
    }

    static __hasRightSideContent(schema, container, parentBlock) {
        let walker = new TreeWalker(container, parentBlock), node,
            nonEmptyElementsMap = schema.getNonEmptyElements();
        while ((node = walker.next())) {
            if (nonEmptyElementsMap[node.nodeName.toLowerCase()] || node.length > 0) {
                return true;
            }
        }
    }

    static __insertBrAtCaret(editor, evt) {
        let selection = editor.selection, dom = editor.dom, rng = selection.getRng(), brElm, extraBr;

        NormalizeRange.normalize(dom, rng).each((normRng) => {
            rng.setStart(normRng.startContainer, normRng.startOffset);
            rng.setEnd(normRng.endContainer, normRng.endOffset);
        });

        let offset = rng.startOffset, container = rng.startContainer;

        if (container.nodeType === 1 && container.hasChildNodes()) {
            let isAfterLastNodeInContainer = offset > container.childNodes.length - 1;
            container = container.childNodes[Math.min(offset, container.childNodes.length - 1)] || container;
            if (isAfterLastNodeInContainer && container.nodeType === 3) {
                offset = container.nodeValue.length;
            }
            else {
                offset = 0;
            }
        }

        let parentBlock = dom.getParent(container, dom.isBlock),
            containerBlock = parentBlock ? dom.getParent(parentBlock.parentNode, dom.isBlock) : null,
            containerBlockName = containerBlock ? containerBlock.nodeName.toUpperCase() : '',
            isControlKey = !!(evt && evt.ctrlKey);

        if (containerBlockName === "LI" && !isControlKey) {
            parentBlock = containerBlock;
        }

        if (container && container.nodeType === 3 && offset >= container.nodeValue.length) {
            // Insert extra BR element at the end block elements
            if (!this.__hasRightSideContent(editor.schema, container, parentBlock)) {
                brElm = dom.create("br");
                rng.insertNode(brElm);
                rng.setStartAfter(brElm);
                rng.setEndAfter(brElm);
                extraBr = true;
            }
        }

        brElm = dom.create("br");
        RangeInsertNode.rangeInsertNode(dom, rng, brElm);
        this.__scrollToBr(dom, selection, brElm);
        this.__moveSelectionToBr(dom, selection, brElm, extraBr);
        editor.undoManager.add();
    }

    static __insertBrBefore(editor, inline) {
        let br = DOMUtils.fromTag("br");
        DOMUtils.before(DOMUtils.fromDom(inline), br);
        editor.undoManager.add();
    }

    static __insertBrAfter(editor, inline) {
        if (!this.__hasBrAfter(editor.getBody(), inline)) {
            DOMUtils.after(DOMUtils.fromDom(inline), DOMUtils.fromTag("br"));
        }

        let br = DOMUtils.fromTag("br");
        DOMUtils.after(DOMUtils.fromDom(inline), br);
        this.__scrollToBr(editor.dom, editor.selection, br.dom());
        this.__moveSelectionToBr(editor.dom, editor.selection, br.dom(), false);
        editor.undoManager.add();
    }

    static __insertBrOutsideAnchor(editor, location) {
        location.fold(() => { },
                      (inline) => this.__insertBrBefore(editor, inline),
                      (inline) => this.__insertBrAfter(editor, inline),
                      () => { });
    }

    static __isInsideAnchor(location) {
        let isAnchorLink = (elm) => elm && elm.nodeName === "A" && "href" in elm;
        return location.fold(Option.constant(false), isAnchorLink, isAnchorLink, Option.constant(false));
    }

    static __moveSelectionToBr(dom, selection, brElm, extraBr) {
        let rng = dom.createRng();
        if (!extraBr) {
            rng.setStartAfter(brElm);
            rng.setEndAfter(brElm);
        }
        else {
            rng.setStartBefore(brElm);
            rng.setEndBefore(brElm);
        }
        selection.setRng(rng);
    }

    static __readInlineAnchorLocation(editor) {
        let isInlineTarget = (elm) => InlineUtils.isInlineTarget(editor, elm),
            position = CaretPosition.fromRangeStart(editor.selection.getRng());
        return BoundaryLocation.readLocation(isInlineTarget, editor.getBody(), position)
                               .filter(this.__isInsideAnchor);
    }

    static __scrollToBr(dom, selection, brElm) {
        let marker = dom.create("span", {}, "&nbsp;");
        brElm.parentNode.insertBefore(marker, brElm);
        selection.scrollIntoView(marker);
        dom.remove(marker);
    }
}