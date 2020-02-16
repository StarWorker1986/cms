import Cell from "../util/Cell";
import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";
import TrimHtml from "../dom/TrimHtml";
import Fragments from "./Fragments";

export default class Levels {
    static applyToEditor(editor, level, before) {
        if (level.type === "fragmented") {
            Fragments.write(level.fragments, editor.getBody());
        }
        else {
            editor.setContent(level.content, { format: "raw" });
        }
        editor.selection.moveToBookmark(before ? level.beforeBookmark : level.bookmark);
    }

    static createFragmentedLevel(fragments) {
        return {
            type: "fragmented",
            fragments: fragments,
            content: '',
            bookmark: null,
            beforeBookmark: null
        };
    }

    static createCompleteLevel(content) {
        return {
            type: "complete",
            fragments: null,
            content: content,
            bookmark: null,
            beforeBookmark: null
        };
    }

    static createFromEditor(editor) {
        let fragments, content, trimmedFragments;
        
        fragments = Fragments.read(editor.getBody());
        trimmedFragments = Tools.bind(fragments, (html) => {
            let trimmed = TrimHtml.trimInternal(editor.serializer, html);
            return trimmed.length > 0 ? [trimmed] : [];
        });
        content = trimmedFragments.join('');

        return content.indexOf("</iframe>") !== -1 ? this.createFragmentedLevel(trimmedFragments)
                                                   : this.createCompleteLevel(content);
    }

    static isEq(level1, level2) {
        if (!level1 || !level2) {
            return false;
        }
        else if (this.__hasEqualContent(level1, level2)) {
            return true;
        }
        else {
            return this.__hasEqualCleanedContent(level1, level2);
        }
    }

    static __getLevelContent(level) {
        return level.type === "fragmented" ? level.fragments.join('') : level.content;
    }

    static __getCleanLevelContent(level) {
        let elm = DOMUtils.fromTag("body", this.__lazyTempDocument());
        $(elm.dom()).html(this.__getLevelContent(level));
        Tools.each(DOMUtils.getAllDescendants(elm, "*[data-editor-bogus]"), DOMUtils.unwrap);
        return elm.dom().innerHtml();
    }

    static __hasEqualContent(level1, level2) {
        return this.__getLevelContent(level1) === this.__getLevelContent(level2);
    }

    static __hasEqualCleanedContent(level1, level2) {
        return this.__getCleanLevelContent(level1) === this.__getCleanLevelContent(level2);
    }

    static __lazyTempDocument() {
        let undoLevelDocument = new Cell(Option.none())
        return undoLevelDocument.get().getOrThunk(() => {
            let doc = document.implementation.createHTMLDocument("undo");
            undoLevelDocument.set(Option.some(doc));
            return doc;
        });
    }
}