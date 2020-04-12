import Option from "../util/Option";
import Settings from "../Settings";
import FontInfo from "../fmt/FontInfo";
import CaretFinder from "../caret/CaretFinder";
import NodeType from "../dom/NodeType";

export default class FontCommands {
    static fontNameAction(editor, value) {
        editor.formatter.toggle("fontname", { value: this.__fromFontSizeNumber(editor, value) });
        editor.nodeChanged();
    }

    static fontNameQuery(editor) {
        let self = this;
        return this.__getCaretElement(editor).fold(
        () => {
            return self.__findFirstCaretElement(editor).map((caretElement) => {
                return FontInfo.getFontFamily(editor.getBody(), caretElement);
            }).getOr(''); 
        },
        (caretElement) => {
            return FontInfo.getFontFamily(editor.getBody(), caretElement);
        });
    }

    static fontSizeAction(editor, value) {
        editor.formatter.toggle("fontsize", { value: this.__fromFontSizeNumber(editor, value) });
        editor.nodeChanged();
    }

    static fontSizeQuery(editor) {
        let self = this;
        return this.__getCaretElement(editor).fold(
        () => {
            return self.__findFirstCaretElement(editor).map((caretElement) => {
                return FontInfo.getFontSize(editor.getBody(), caretElement);
            }).getOr('');
        },
        (caretElement) => {
            return FontInfo.getFontSize(editor.getBody(), caretElement);
        });
    }

    static __findFirstCaretElement(editor) {
        return CaretFinder.firstPositionIn(editor.getBody()).map((caret) => {
            let container = caret.container();
            return NodeType.isText(container) ? container.parentNode : container;
        });
    }

    static __fromFontSizeNumber(editor, value) {
        if (/^[0-9\.]+$/.test(value)) {
            let fontSizeNumber = parseInt(value, 10);
            if (fontSizeNumber >= 1 && fontSizeNumber <= 7) {
                let fontSizes = Settings.getFontStyleValues(editor),
                    fontClasses = Settings.getFontSizeClasses(editor);

                if (fontClasses) {
                    return fontClasses[fontSizeNumber - 1] || value;
                }
                else {
                    return fontSizes[fontSizeNumber - 1] || value;
                }
            }
            else {
                return value;
            }
        }
        else {
            return value;
        }
    }

    static __getCaretElement(editor) {
        let self = this;
        return Option.from(editor.selection.getRng()).bind((rng) => {
            let root = editor.getBody();
            return self.__isRangeAtStartOfNode(rng, root) ? Option.none() : Option.from(editor.selection.getStart(true));
        });
    }

    static __isRangeAtStartOfNode(rng, root) {
        return rng.startContainer === root && rng.startOffset === 0;
    }
}