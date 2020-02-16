export default class MousePosition {
    static calc(editor, event) {
        return this.__calculatePosition(this.__getBodyPosition(editor),
                                        this.__getScrollPosition(editor),
                                        this.__getMousePosition(editor, event));
    }

    static __getAbsolutePosition(elm) {
        let doc, docElem, win, clientRect;

        clientRect = elm.getBoundingClientRect();
        doc = elm.ownerDocument;
        docElem = doc.documentElement;
        win = doc.defaultView;

        return {
            top: clientRect.top + win.pageYOffset - docElem.clientTop,
            left: clientRect.left + win.pageXOffset - docElem.clientLeft
        };
    }

    static __getBodyPosition(editor) {
        return editor.inline ? this.__getAbsolutePosition(editor.getBody()) : { left: 0, top: 0 };
    }

    static __getScrollPosition(editor) {
        let body = editor.getBody();
        return editor.inline ? { left: body.scrollLeft, top: body.scrollTop } : { left: 0, top: 0 };
    }

    static __getBodyScroll(editor) {
        let body = editor.getBody(), docElm = editor.getDoc().documentElement,
            inlineScroll = { left: body.scrollLeft, top: body.scrollTop },
            iframeScroll = { left: body.scrollLeft || docElm.scrollLeft, top: body.scrollTop || docElm.scrollTop };
        return editor.inline ? inlineScroll : iframeScroll;
    }

    static __getMousePosition(editor, event) {
        if (event.target.ownerDocument !== editor.getDoc()) {
            let iframePosition = this.__getAbsolutePosition(editor.getContentAreaContainer()),
                scrollPosition = this.__getBodyScroll(editor);
            return {
                left: event.pageX - iframePosition.left + scrollPosition.left,
                top: event.pageY - iframePosition.top + scrollPosition.top
            };
        }
        return {
            left: event.pageX,
            top: event.pageY
        };
    }

    static __calculatePosition(bodyPosition, scrollPosition, mousePosition) {
        return {
            pageX: (mousePosition.left - bodyPosition.left) + scrollPosition.left,
            pageY: (mousePosition.top - bodyPosition.top) + scrollPosition.top
        };
    }
}