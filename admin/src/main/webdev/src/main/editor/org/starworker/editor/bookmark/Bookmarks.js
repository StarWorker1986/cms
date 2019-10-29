import GetBookmark from "./GetBookmark";
import ResolveBookmark from "./ResolveBookmark";
import NodeType from "../dom/NodeType";

export default class Bookmarks {
    static getBookmark(selection, type, normalized) {
        return GetBookmark.getBookmark(selection, type, normalized);
    }

    static moveToBookmark(selection, bookmark) {
        ResolveBookmark.resolve(selection, bookmark).each((rng) => {
            selection.setRng(rng);
        });
    }

    static isBookmarkNode(node) {
        return NodeType.isElement(node) && node.tagName === "SPAN" && node.getAttribute("data-editor-type") === "bookmark";
    }
}