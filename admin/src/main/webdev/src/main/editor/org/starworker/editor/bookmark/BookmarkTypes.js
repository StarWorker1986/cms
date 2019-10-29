import Tools from "../util/Tools";

export default class BookmarkTypes {
    static isStringPathBookmark(bookmark) {
        return typeof bookmark.start === "string";
    }

    static isRangeBookmark(bookmark) {
        return bookmark.hasOwnProperty("rng");
    }

    static isIdBookmark(bookmark) {
        return bookmark.hasOwnProperty("id");
    }

    static isIndexBookmark(bookmark) {
        return bookmark.hasOwnProperty("name");
    }

    static isPathBookmark(bookmark) {
        return Tools.isArray(bookmark.start);
    }
}