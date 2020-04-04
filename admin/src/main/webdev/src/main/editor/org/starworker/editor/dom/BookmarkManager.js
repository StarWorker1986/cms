import Bookmarks from "../bookmark/Bookmarks";

export default class BookmarkManager {
    constructor(selection) {
        this._selection = selection;
    }

    getBookmark(type, normalized) {
        return Bookmarks.getBookmark(this._selection, type, normalized);
    }

    moveToBookmark(bookmark) {
        return Bookmarks.moveToBookmark(this._selection, bookmark);
    }
}