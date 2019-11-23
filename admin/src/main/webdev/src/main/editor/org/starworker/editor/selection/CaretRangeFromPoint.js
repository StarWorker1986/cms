import NodeType from "../dom/NodeType";
import Tools from "../util/Tools";

export class caretPositionFromPoint {
    static fromPoint(clientX, clientY, doc) {
        let rng, point, pointDoc = doc;

        if (pointDoc.caretPositionFromPoint) {
            point = pointDoc.caretPositionFromPoint(clientX, clientY);
            if (point) {
                rng = doc.createRange();
                rng.setStart(point.offsetNode, point.offset);
                rng.collapse(true);
            }
        }
        else if (doc.caretRangeFromPoint) {
            rng = doc.caretRangeFromPoint(clientX, clientY);
        }
        else if (pointDoc.body.createTextRange) {
            rng = pointDoc.body.createTextRange();
            try {
                rng.moveToPoint(clientX, clientY);
                rng.collapse(true);
            }
            catch (ex) {
                rng = this.__findClosestIeRange(clientX, clientY, doc);
            }
            return this.__moveOutOfContentEditableFalse(rng, doc.body);
        }

        return rng;
    }

    static __findClosestIeRange(clientX, clientY, doc) {
        let element, rng, rects;

        element = doc.elementFromPoint(clientX, clientY);
        rng = doc.body.createTextRange();

        if (!element || element.tagName === "HTML") {
            element = doc.body;
        }

        rng.moveToElementText(element);
        rects = Tools.toArray(rng.getClientRects());
        rects = rects.sort((a, b) => {
            a = Math.abs(Math.max(a.top - clientY, a.bottom - clientY));
            b = Math.abs(Math.max(b.top - clientY, b.bottom - clientY));
            return a - b;
        });

        if (rects.length > 0) {
            clientY = (rects[0].bottom + rects[0].top) / 2;
            try {
                rng.moveToPoint(clientX, clientY);
                rng.collapse(true);
                return rng;
            }
            catch (ex) {
                // At least we tried
            }
        }

        return null;
    }

    static __moveOutOfContentEditableFalse(rng, rootNode) {
        let parentElement = rng && rng.parentElement ? rng.parentElement() : null;
        let hasCeProperty = (node) => {
            return NodeType.isContentEditableTrue(node) || NodeType.isContentEditableFalse(node);
        };

        return NodeType.isContentEditableFalse(this.__findParent(parentElement, rootNode, hasCeProperty)) ? null : rng;
    }

    static __findParent(node, rootNode, predicate) {
        while (node && node !== rootNode) {
            if (predicate(node)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }
}