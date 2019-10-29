import CaretContainer from "./CaretContainer";
import CaretContainerRemove from "./CaretContainerRemove";
import NodeType from "../dom/NodeType";
import GeomClientRect from "../geom/ClientRect";
import Delay from "../util/Delay";
import Cell from "../util/Cell";
import Option from "../util/Option";
import PlatformDetection from "../util/PlatformDetection";

export default class FakeCaret {
    constructor(root, isBlock, hasFocus) {
        this.root = root;
        this.isBlock = isBlock;
        this.hasFocus = hasFocus;
        this._caretContainerNode = null;
        this._cursorInterval = null;
        this._caretContainerNode = null;
        this._lastVisualCaret = new Cell(Option.none());
    }

    destroy() { 
        return Delay.clearInterval(this.cursorInterval); 
    }

    getCss() {
        return (".editor-visual-caret {" +
            "position: absolute;" +
            "background-color: black;" +
            "background-color: currentcolor;" +
            "}" +
            ".editor-visual-caret-hidden {" +
            "display: none;" +
            "}" +
            "*[data-editor-caret] {" +
            "position: absolute;" +
            "left: -1000px;" +
            "right: auto;" +
            "top: 0;" +
            "margin: 0;" +
            "padding: 0;" +
            "}");
    }

    hide() {
        let caretContainerNode = this._caretContainerNode, lastVisualCaret = this._lastVisualCaret;
        this.__trimInlineCaretContainers(this.root);
        if (caretContainerNode) {
            CaretContainerRemove.remove(caretContainerNode);
            this._caretContainerNode = null;
        }
        lastVisualCaret.get().each((caretState) => {
            $(caretState.caret).remove();
            lastVisualCaret.set(Option.none());
        });
        clearInterval(this._cursorInterval);
    }

    static isFakeCaretTableBrowser() {
        let browser = PlatformDetection.detect().browser;
        return browser.isIE() || browser.isEdge() || browser.isFirefox(); 
    }

    static isFakeCaretTarget(node) { 
        return NodeType.isContentEditableFalse(node) || (NodeType.isTable(node) && this.isFakeCaretTableBrowser()); 
    }

    reposition() {
        this._lastVisualCaret.get().each((caretState) => {
            let clientRect = this.__getAbsoluteClientRect(this.root, caretState.element, caretState.before);
            $(caretState.caret).css(clientRect);
        });
    }

    show(before, element) {
        this.hide();
        if (this.__isTableCell(element)) {
            return null;
        }

        let clientRect, rng, caretContainerNode, lastVisualCaret = this._lastVisualCaret;

        if (this.isBlock(element)) {
            caretContainerNode = CaretContainer.insertBlock('p', element, before);
            
            clientRect = this.__getAbsoluteClientRect(this.root, element, before);
            $(caretContainerNode).css("top", clientRect.top);
            
            let caret = $('<div class="editor-visual-caret" data-editor-bogus="all"></div>').css(clientRect).appendTo(this.root)[0];
            lastVisualCaret.set(Option.some({ caret: caret, element: element, before: before }));
            lastVisualCaret.get().each((caretState) => {
                if (before) {
                    $(caretState.caret).addClass("editor-visual-caret-before");
                }
            });

            this.__startBlink();
            rng = element.ownerDocument.createRange();
            rng.setStart(caretContainerNode, 0);
            rng.setEnd(caretContainerNode, 0);
        }
        else {
            caretContainerNode = CaretContainer.insertInline(element, before);
            rng = element.ownerDocument.createRange();
            if (NodeType.isContentEditableFalse(caretContainerNode.nextSibling)) {
                rng.setStart(caretContainerNode, 0);
                rng.setEnd(caretContainerNode, 0);
            }
            else {
                rng.setStart(caretContainerNode, 1);
                rng.setEnd(caretContainerNode, 1);
            }
        }
        this._caretContainerNode = caretContainerNode;

        return rng;
    }

    __isTableCell(node) {
        return NodeType.isElement(node) && /^(TD|TH)$/i.test(node.tagName);
    }

    __getAbsoluteClientRect(root, element, before) {
        let clientRect = GeomClientRect.collapse(element.getBoundingClientRect(), before);
        let docElm, scrollX, scrollY, margin, rootRect;

        if (root.tagName === "BODY") {
            docElm = root.ownerDocument.documentElement;
            scrollX = root.scrollLeft || docElm.scrollLeft;
            scrollY = root.scrollTop || docElm.scrollTop;
        }
        else {
            rootRect = root.getBoundingClientRect();
            scrollX = root.scrollLeft - rootRect.left;
            scrollY = root.scrollTop - rootRect.top;
        }
        clientRect.left += scrollX;
        clientRect.right += scrollX;
        clientRect.top += scrollY;
        clientRect.bottom += scrollY;
        clientRect.width = 1;
        margin = element.offsetWidth - element.clientWidth;
        
        if (margin > 0) {
            if (before) {
                margin *= -1;
            }
            clientRect.left += margin;
            clientRect.right += margin;
        }

        return clientRect;
    }

    __startBlink() {
        this._cursorInterval = Delay.setInterval(() => {
            if (this.hasFocus()) {
                $("div.editor-visual-caret", root).toggleClass("editor-visual-caret-hidden");
            }
            else {
                $("div.editor-visual-caret", root).addClass("editor-visual-caret-hidden");
            }
        }, 500);
    }

    __trimInlineCaretContainers(root) {
        let contentEditableFalseNodes, node, sibling, i, data;
        
        contentEditableFalseNodes = $("*[contentEditable=false]", root);
        
        for (i = 0; i < contentEditableFalseNodes.length; i++) {
            node = contentEditableFalseNodes[i];
            sibling = node.previousSibling;
            if (CaretContainer.endsWithCaretContainer(sibling)) {
                data = sibling.data;
                if (data.length === 1) {
                    sibling.parentNode.removeChild(sibling);
                }
                else {
                    sibling.deleteData(data.length - 1, 1);
                }
            }

            sibling = node.nextSibling;
            if (CaretContainer.startsWithCaretContainer(sibling)) {
                data = sibling.data;
                if (data.length === 1) {
                    sibling.parentNode.removeChild(sibling);
                }
                else {
                    sibling.deleteData(0, 1);
                }
            }
        }
    }
}