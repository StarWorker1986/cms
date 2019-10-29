import { Option, Options } from "@ephox/katamari";
import Env from "../api/Env";
import CaretBookmark from "./CaretBookmark";
import { CaretPosition } from "../caret/CaretPosition";
import NodeType from "../dom/NodeType";
import Tools from "../api/util/Tools";
import { getParentCaretContainer } from "../fmt/FormatContainer";
import Zwsp from "../text/Zwsp";
import CaretFinder from "../caret/CaretFinder";
import BookmarkTypes from "./BookmarkTypes";

export default class ResolveBookmark {
    static resolve(selection, bookmark) {
        let dom = selection.dom;

        if (bookmark) {
            if (BookmarkTypes.isPathBookmark(bookmark)) {
                return this.__resolvePaths(dom, bookmark);
            }
            else if (BookmarkTypes.isStringPathBookmark(bookmark)) {
                return Option.some(this.__resolveCaretPositionBookmark(dom, bookmark));
            }
            else if (BookmarkTypes.isIdBookmark(bookmark)) {
                return this.__resolveId(dom, bookmark);
            }
            else if (BookmarkTypes.isIndexBookmark(bookmark)) {
                return this.__resolveIndex(dom, bookmark);
            }
            else if (BookmarkTypes.isRangeBookmark(bookmark)) {
                return Option.some(bookmark.rng);
            }
        }
        return Option.none();
    }

    static __addBogus(dom, node) {
        if (dom.isBlock(node) && !node.innerHTML && !Env.ie) {
            node.innerHTML = '<br data-mce-bogus="1" />';
        }
        return node;
    }

    static __resolveCaretPositionBookmark(dom, bookmark) {
        let rng, pos;

        rng = dom.createRng();
        pos = CaretBookmark.resolve(dom.getRoot(), bookmark.start);
        rng.setStart(pos.container(), pos.offset());

        pos = CaretBookmark.resolve(dom.getRoot(), bookmark.end);
        rng.setEnd(pos.container(), pos.offset());

        return rng;
    }

    static __insertZwsp(node, rng) {
        let textNode = node.ownerDocument.createTextNode(Zwsp.ZWSP);

        node.appendChild(textNode);
        rng.setStart(textNode, 0);
        rng.setEnd(textNode, 0);
    }

    static __isEmpty(node) {
        return node.hasChildNodes() === false;
    }

    static __tryFindRangePosition(node, rng) {
        return CaretFinder.lastPositionIn(node).fold(() => { return false; }, (pos) => {
            rng.setStart(pos.container(), pos.offset());
            rng.setEnd(pos.container(), pos.offset());
            return true;
        });
    }

    static __padEmptyCaretContainer(root, node, rng) {
        if (isEmpty(node) && getParentCaretContainer(root, node)) {
            insertZwsp(node, rng);
            return true;
        }
        else {
            return false;
        }
    }

    static __setEndPoint(dom, start, bookmark, rng) {
        let point = bookmark[start ? "start" : "end"], i, node, offset, children, root = dom.getRoot();

        if (point) {
            offset = point[0];
            for (node = root, i = point.length - 1; i >= 1; i--) {
                children = node.childNodes;
                if (padEmptyCaretContainer(root, node, rng)) {
                    return true;
                }
                if (point[i] > children.length - 1) {
                    if (padEmptyCaretContainer(root, node, rng)) {
                        return true;
                    }
                    return tryFindRangePosition(node, rng);
                }
                node = children[point[i]];
            }

            if (node.nodeType === 3) {
                offset = Math.min(point[0], node.nodeValue.length);
            }

            if (node.nodeType === 1) {
                offset = Math.min(point[0], node.childNodes.length);
            }

            if (start) {
                rng.setStart(node, offset);
            }
            else {
                rng.setEnd(node, offset);
            }
        }

        return true;
    }

    static __isValidTextNode(node) {
        return NodeType.isText(node) && node.data.length > 0;
    }

    static __restoreEndPoint(dom, suffix, bookmark) {
        let marker = dom.get(bookmark.id + '_' + suffix), node, idx, next, prev, keep = bookmark.keep, container, offset;

        if (marker) {
            node = marker.parentNode;
            if (suffix === "start") {
                if (!keep) {
                    idx = dom.nodeIndex(marker);
                }
                else {
                    if (marker.hasChildNodes()) {
                        node = marker.firstChild;
                        idx = 1;
                    }
                    else if (isValidTextNode(marker.nextSibling)) {
                        node = marker.nextSibling;
                        idx = 0;
                    }
                    else if (isValidTextNode(marker.previousSibling)) {
                        node = marker.previousSibling;
                        idx = marker.previousSibling.data.length;
                    }
                    else {
                        node = marker.parentNode;
                        idx = dom.nodeIndex(marker) + 1;
                    }
                }
                container = node;
                offset = idx;
            }
            else {
                if (!keep) {
                    idx = dom.nodeIndex(marker);
                }
                else {
                    if (marker.hasChildNodes()) {
                        node = marker.firstChild;
                        idx = 1;
                    }
                    else if (isValidTextNode(marker.previousSibling)) {
                        node = marker.previousSibling;
                        idx = marker.previousSibling.data.length;
                    }
                    else {
                        node = marker.parentNode;
                        idx = dom.nodeIndex(marker);
                    }
                }
                container = node;
                offset = idx;
            }

            if (!keep) {
                prev = marker.previousSibling;
                next = marker.nextSibling;

                Tools.each(Tools.grep(marker.childNodes), (node) => {
                    if (NodeType.isText(node)) {
                        node.nodeValue = node.nodeValue.replace(/\uFEFF/g, '');
                    }
                });

                while ((marker = dom.get(bookmark.id + '_' + suffix))) {
                    dom.remove(marker, true);
                }

                if (prev && next && prev.nodeType === next.nodeType && NodeType.isText(prev) && !Env.opera) {
                    idx = prev.nodeValue.length;
                    prev.appendData(next.nodeValue);
                    dom.remove(next);
                    if (suffix === "start") {
                        container = prev;
                        offset = idx;
                    }
                    else {
                        container = prev;
                        offset = idx;
                    }
                }
            }
            return Option.some(CaretPosition(container, offset));
        }
        else {
            return Option.none();
        }
    }

    static __alt(o1, o2) {
        return o1.isSome() ? o1 : o2;
    }

    static __resolvePaths(dom, bookmark) {
        let rng = dom.createRng();

        if (setEndPoint(dom, true, bookmark, rng) && setEndPoint(dom, false, bookmark, rng)) {
            return Option.some(rng);
        }
        else {
            return Option.none();
        }
    }

    static __resolveId(dom, bookmark) {
        let startPos = restoreEndPoint(dom, "start", bookmark), endPos = restoreEndPoint(dom, "end", bookmark);

        return Options.liftN([
            startPos,
            alt(endPos, startPos)
        ], (spos, epos) => {
            let rng = dom.createRng();
            rng.setStart(addBogus(dom, spos.container()), spos.offset());
            rng.setEnd(addBogus(dom, epos.container()), epos.offset());
            return rng;
        });
    }

    static __resolveIndex(dom, bookmark) {
        return Option.from(dom.select(bookmark.name)[bookmark.index]).map((elm) => {
            return dom.createRng().selectNode(elm);
        });
    }
};