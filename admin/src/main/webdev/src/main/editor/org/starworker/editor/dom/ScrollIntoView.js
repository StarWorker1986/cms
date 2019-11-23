import Tools from "../util/Tools";
import NodeType from "../dom/NodeType";
import GeomClientRect from "../geom/ClientRect";
import CaretPosition from "../caret/CaretPosition";

export default class ScrollIntoView {
    static scrollElementIntoView(editor, elm, alignToTop) {
        let y, viewPort, dom = editor.dom, root = dom.getRoot(), viewPortY, viewPortH, offsetY = 0;

        if (this.__fireScrollIntoViewEvent(editor, elm, alignToTop)) {
            return;
        }

        if (!NodeType.isElement(elm)) {
            return;
        }

        if (alignToTop === false) {
            offsetY = elm.offsetHeight;
        }

        if (root.nodeName !== "BODY") {
            let scrollContainer = editor.selection.getScrollContainer();

            if (scrollContainer) {
                y = this.__getPos(elm).y - this.__getPos(scrollContainer).y + offsetY;
                viewPortH = scrollContainer.clientHeight;
                viewPortY = scrollContainer.scrollTop;
                if (y < viewPortY || y + 25 > viewPortY + viewPortH) {
                    scrollContainer.scrollTop = y < viewPortY ? y : y - viewPortH + 25;
                }
                return;
            }
        }

        viewPort = dom.getViewPort(editor.getWin());
        y = dom.getPos(elm).y + offsetY;
        viewPortY = viewPort.y;
        viewPortH = viewPort.h;

        if (y < viewPort.y || y + 25 > viewPortY + viewPortH) {
            editor.getWin().scrollTo(0, y < viewPortY ? y : y - viewPortH + 25);
        }
    }

    static scrollRangeIntoView(editor, rng) {
        Tools.head(CaretPosition.fromRangeStart(rng).getClientRects()).each((rngRect) => {
            let bodyRect = this.__getViewPortRect(editor),
                overflow = GeomClientRect.getOverflow(bodyRect, rngRect),
                margin = 4,
                dx = overflow.x > 0 ? overflow.x + margin : overflow.x - margin,
                dy = overflow.y > 0 ? overflow.y + margin : overflow.y - margin;

            this.__scrollBy(editor, overflow.x !== 0 ? dx : 0, overflow.y !== 0 ? dy : 0);
        });
    }

    static __fireScrollIntoViewEvent(editor, elm, alignToTop) {
        let scrollEvent = { elm: elm, alignToTop: alignToTop };
        editor.fire("scrollIntoView", scrollEvent);
        return scrollEvent.isDefaultPrevented();
    }

    static __getViewPortRect(editor) {
        if (editor.inline) {
            return editor.getBody().getBoundingClientRect();
        }
        else {
            let win = editor.getWin();
            return {
                left: 0,
                right: win.innerWidth,
                top: 0,
                bottom: win.innerHeight,
                width: win.innerWidth,
                height: win.innerHeight
            };
        }
    }

    static __getPos(elm) {
        let x = 0, y = 0, offsetParent = elm;

        while (offsetParent && offsetParent.nodeType) {
            x += offsetParent.offsetLeft || 0;
            y += offsetParent.offsetTop || 0;
            offsetParent = offsetParent.offsetParent;
        }

        return { x: x, y: y };
    }

    static __scrollBy(editor, dx, dy) {
        if (editor.inline) {
            editor.getBody().scrollLeft += dx;
            editor.getBody().scrollTop += dy;
        }
        else {
            editor.getWin().scrollBy(dx, dy);
        }
    }
}