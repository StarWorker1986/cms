import Option from "./util/Option";
import DOMUtils from "./dom/DOMUtils";

export default class EditorView {
    static isXYInContentArea(editor, clientX, clientY) {
        let bodyElm = DOMUtils.fromDom(editor.getBody()),
            targetElm = editor.inline ? bodyElm : DOMUtils.documentElement(bodyElm),
            transposedPoint = transpose(editor.inline, targetElm, clientX, clientY);
        return this.__isInsideElementContentArea(targetElm, transposedPoint.x, transposedPoint.y);
    }

    static isEditorAttachedToDom(editor) {
        let rawContainer = editor.inline ? editor.getBody() : editor.getContentAreaContainer();
        return Option.from(rawContainer).map(DOMUtils.fromDom).map((container) => {
            return DOMUtils.contains(DOMUtils.owner(container), container);
        }).getOr(false);
    }

    static __isInsideElementContentArea(bodyElm, clientX, clientY) {
        let getClientWidth = (elm) => elm.dom()["clientWidth"],
            getClientHeight = (elm) => elm.dom()["clientHeight"],
            clientWidth = getClientWidth(bodyElm),
            clientHeight = getClientHeight(bodyElm);
        return clientX >= 0 && clientY >= 0 && clientX <= clientWidth && clientY <= clientHeight;
    }

    static __transpose(inline, elm, clientX, clientY) {
        let clientRect = elm.dom().getBoundingClientRect(),
            getMarginTop = (elm) => parseInt(DOMUtils.getCss(elm, "margin-top")),
            getMarginLeft = (elm) => parseInt(DOMUtils.getCss(elm, "margin-left")),
            deltaX = inline ? clientRect.left + elm.dom().clientLeft + getMarginLeft(elm) : 0,
            deltaY = inline ? clientRect.top + elm.dom().clientTop + getMarginTop(elm) : 0,
            x = clientX - deltaX, y = clientY - deltaY;
        return { x: x, y: y };
    }
}