import CaretBookmark from "./CaretBookmark";
import CaretContainer from "../caret/CaretContainer";
import CaretPosition from "../caret/CaretPosition";
import NodeType from "../dom/NodeType";
import RangeNodes from "../selection/RangeNodes";
import Zwsp from "../text/Zwsp";
import Tools from "../util/Tools";
import RangeInsertNode from "../selection/RangeInsertNode";

export default class GetBookmark {
    static getBookmark(selection, type, normalized) {
        if (type === 2) {
            return this.__getOffsetBookmark(Zwsp.trim, normalized, selection);
        }
        else if (type === 3) {
            return this.__getCaretBookmark(selection);
        }
        else if (type) {
            return this.__getRangeBookmark(selection);
        }
        else {
            return this.getPersistentBookmark(selection, false);
        }
    }

    static getUndoBookmark(selection) {
        return this.__getOffsetBookmark(x => x, true, selection);
    }

    static getPersistentBookmark(selection, filled) {
        let dom = selection.dom, rng = selection.getRng(), id = dom.uniqueId(), element = selection.getNode();

        let name = element.nodeName;
        if (name === "IMG") {
            return { name: name, index: this.__findIndex(dom, name, element) };
        }

        let rng2 = this.__normalizeTableCellSelection(rng.cloneRange());
        if (!selection.isCollapsed()) {
            rng2.collapse(false);
            RangeInsertNode.rangeInsertNode(dom, rng2, this.__createBookmarkSpan(dom, id + "_end", filled));
        }

        rng = this.__normalizeTableCellSelection(rng);
        rng.collapse(true);
        RangeInsertNode.rangeInsertNode(dom, rng, this.__createBookmarkSpan(dom, id + "_start", filled));
        selection.moveToBookmark({ id: id, keep: 1 });

        return { id: id };
    }

    static __getNormalizedTextOffset(trim, container, offset) {
        let node, trimmedOffset;
        trimmedOffset = trim(container.data.slice(0, offset)).length;
        for (node = container.previousSibling; node && NodeType.isText(node); node = node.previousSibling) {
            trimmedOffset += trim(node.data).length;
        }
        return trimmedOffset;
    }

    static __getPoint(dom, trim, normalized, rng, start) {
        let container = rng[start ? "startContainer" : "endContainer"],
            offset = rng[start ? "startOffset" : "endOffset"], point = [];

        if (NodeType.isText(container)) {
            point.push(normalized ? this.__getNormalizedTextOffset(trim, container, offset) : offset);
        }
        else {
            let after = 0, childNodes = container.childNodes;

            if (offset >= childNodes.length && childNodes.length) {
                after = 1;
                offset = Math.max(0, childNodes.length - 1);
            }
            point.push(dom.nodeIndex(childNodes[offset], normalized) + after);
        }

        for (; container && container !== dom.getRoot(); container = container.parentNode) {
            point.push(dom.nodeIndex(container, normalized));
        }

        return point;
    }

    static __getLocation(trim, selection, normalized, rng) {
        let dom = selection.dom, bookmark = {};
        bookmark.start = this.__getPoint(dom, trim, normalized, rng, true);
        if (!selection.isCollapsed()) {
            bookmark.end = this.__getPoint(dom, trim, normalized, rng, false);
        }
        return bookmark;
    }

    static __findIndex(dom, name, element) {
        let count = 0;

        Tools.each(dom.select(name), function (node) {
            if (node.getAttribute("data-editor-bogus") === "all") {
                return;
            }
            if (node === element) {
                return false;
            }
            count++;
        });

        return count;
    }

    static __moveEndPoint(rng, start) {
        let container, offset, childNodes, prefix = start ? "start" : "end";

        container = rng[prefix + "Container"];
        offset = rng[prefix + "Offset"];

        if (NodeType.isElement(container) && container.nodeName === "TR") {
            childNodes = container.childNodes;
            container = childNodes[Math.min(start ? offset : offset - 1, childNodes.length - 1)];
            if (container) {
                offset = start ? 0 : container.childNodes.length;
                rng["set" + (start ? "Start" : "End")](container, offset);
            }
        }
    }

    static __normalizeTableCellSelection(rng) {
        this.__moveEndPoint(rng, true);
        this.__moveEndPoint(rng, false);
        return rng;
    }

    static __findSibling(node, offset) {
        if (NodeType.isElement(node)) {
            node = RangeNodes.getNode(node, offset);
            if (NodeType.isContentEditableFalse(node)) {
                return node;
            }
        }

        if (CaretContainer.isCaretContainer(node)) {
            if (NodeType.isText(node) && CaretContainer.isCaretContainerBlock(node)) {
                node = node.parentNode;
            }

            let sibling = node.previousSibling;
            if (NodeType.isContentEditableFalse(sibling)) {
                return sibling;
            }

            sibling = node.nextSibling;
            if (NodeType.isContentEditableFalse(sibling)) {
                return sibling;
            }
        }
    }

    static __findAdjacentContentEditableFalseElm(rng) {
        return this.__findSibling(rng.startContainer, rng.startOffset)
            || this.__findSibling(rng.endContainer, rng.endOffset);
    }

    static __getOffsetBookmark(trim, normalized, selection) {
        let element = selection.getNode(), name = element ? element.nodeName : null, rng = selection.getRng();

        if (NodeType.isContentEditableFalse(element) || name === "IMG") {
            return { name: name, index: this.__findIndex(selection.dom, name, element) };
        }

        let sibling = this.__findAdjacentContentEditableFalseElm(rng);
        if (sibling) {
            name = sibling.tagName;
            return { name: name, index: this.__findIndex(selection.dom, name, sibling) };
        }

        return this.__getLocation(trim, selection, normalized, rng);
    }

    static __getCaretBookmark(selection) {
        let rng = selection.getRng();
        return {
            start: CaretBookmark.create(selection.dom.getRoot(), CaretPosition.fromRangeStart(rng)),
            end: CaretBookmark.create(selection.dom.getRoot(), CaretPosition.fromRangeEnd(rng))
        };
    }

    static __getRangeBookmark(selection) {
        return { rng: selection.getRng() };
    }

    static __createBookmarkSpan(dom, id, filled) {
        let args = { "data-editor-type": "bookmark", "id": id, "style": "overflow:hidden;line-height:0px" };
        return filled ? dom.create("span", args, "&#xFEFF;") : dom.create("span", args);
    }
}