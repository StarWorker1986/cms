import Option from "../util/Option";
import PlatformDetection from "../util/PlatformDetection";
import DOMUtils from "../dom/DOMUtils";

export default class SelectionBookmark {
    static getBookmark(root) {
        let win = DOMUtils.fromDom(root.dom().ownerDocument.defaultView());
        return this.readRange(win.dom()).filter(this.__isRngInRoot(root));
    }

    static getRng(editor) {
        let bookmark = editor.bookmark ? editor.bookmark : Option.none();
        return bookmark.bind(b => validate(DOMUtils.fromDom(editor.getBody()), b))
                       .bind(this.__bookmarkToNativeRng);
    }

    static readRange(win) {
        let selection = win.getSelection(),
            rng = !selection || selection.rangeCount === 0 ? Option.none() : Option.from(selection.getRangeAt(0));
        return rng.map(this.__nativeRangeToSelectionRange);
    }

    static restore(editor) {
        this.getRng(editor).each(rng => {
            editor.selection.setRng(rng);
        });
    }

    static store(editor) {
        let newBookmark = this.__shouldStore(editor) ? this.getBookmark(DOMUtils.fromDom(editor.getBody())) : Option.none();
        editor.bookmark = newBookmark.isSome() ? newBookmark : editor.bookmark;
    }

    static storeNative(editor, rng) {
        let root = DOMUtils.fromDom(editor.getBody()),
            range = this.__shouldStore(editor) ? Option.from(rng) : Option.none(),
            newBookmark = range.map(this.__nativeRangeToSelectionRange).filter(this.__isRngInRoot(root));

        editor.bookmark = newBookmark.isSome() ? newBookmark : editor.bookmark;
    }

    static validate(root, bookmark) {
        let normalizeRng = (rng) => this.__createSimRange(rng.start(), this.__clamp(rng.soffset(), rng.start()), rng.finish(), this.__clamp(rng.foffset(), rng.finish()));
        return Option.from(bookmark).filter(this.__isRngInRoot(root)).map(normalizeRng);
    }

    static __bookmarkToNativeRng(bookmark) {
        let rng = document.createRange();
        try {
            // Might throw IndexSizeError
            rng.setStart(bookmark.start().dom(), bookmark.soffset());
            rng.setEnd(bookmark.finish().dom(), bookmark.foffset());
            return Option.some(rng);
        }
        catch (_) {
            return Option.none();
        }
    };

    static __createSimRange() {
        return Tools.immutable("start", "soffset", "finish", "foffset");
    }

    static __clamp(offset, element) {
        let max = NodeType.isText(element.dom()) ? element.dom().nodeValue.length : DOMUtils.childNodesCount(element) + 1;
        if (offset > max) {
            return max;
        }
        else if (offset < 0) {
            return 0;
        }
        return offset;
    }

    static __nativeRangeToSelectionRange(r) {
        return this.__createSimRange(DOMUtils.fromDom(r.startContainer), r.startOffset, DOMUtils.fromDom(r.endContainer), r.endOffset);
    }

    static __isRngInRoot(root) {
        let isOrContains = (root, elm) => DOMUtils.contains(root, elm) || root.dom() === elm.dom();
        return (rng) => {
            return isOrContains(root, rng.start()) && isOrContains(root, rng.finish());
        }
    }

    static __shouldStore(editor) {
        let browser = PlatformDetection.detect().browser;
        return editor.inline === true || browser.isIE();
    }
}