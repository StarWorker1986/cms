class LineUtils {
    static closestCaret(root, clientX, clientY) {
        let closestNodeRect,
            contentEditableFalseNodeRects = Dimensions.getClientRects(this.__getFakeCaretTargets(root)),
            targetNodeRects = Tools.filter(contentEditableFalseNodeRects, rect => clientY >= rect.top && clientY <= rect.bottom);

        closestNodeRect = this.findClosestClientRect(targetNodeRects, clientX);
        if (closestNodeRect) {
            closestNodeRect = this.findClosestClientRect(this.findLineNodeRects(root, closestNodeRect), clientX);
            if (closestNodeRect && FakeCaret.isFakeCaretTarget(closestNodeRect.node)) {
                return this.__caretInfo(closestNodeRect, clientX);
            }
        }
        return null;
    }

    static findClosestClientRect(clientRects, clientX) {
        return ArrUtils.reduce(clientRects, (oldClientRect, clientRect) => {
            let oldDistance, newDistance;
            oldDistance = Math.min(this.__distanceToRectLeft(oldClientRect, clientX), this.__distanceToRectRight(oldClientRect, clientX));
            newDistance = Math.min(this.__distanceToRectLeft(clientRect, clientX), this.__distanceToRectRight(clientRect, clientX));
            if (this.__isInside(clientX, clientRect)) {
                return clientRect;
            }

            if (this.__isInside(clientX, oldClientRect)) {
                return oldClientRect;
            }

            // cE=false has higher priority
            if (newDistance === oldDistance && NodeType.isContentEditableFalse(clientRect.node)) {
                return clientRect;
            }

            if (newDistance < oldDistance) {
                return clientRect;
            }

            return oldClientRect;
        });
    }

    static findLineNodeRects(root, targetNodeRect) {
        let clientRects = [];
        let collect = (checkPosFn, node) => {
            let lineRects;
            lineRects = Tools.filter(Dimensions.getClientRects([node]), (clientRect) => {
                return !checkPosFn(clientRect, targetNodeRect);
            });
            clientRects = clientRects.concat(lineRects);
            return lineRects.length === 0;
        };

        clientRects.push(targetNodeRect);
        this.__walkUntil(VDirection.Up, root, n => collect((r1, r2) => GeomClientRect.isAbove(r1, r2), n), targetNodeRect.node);
        this.__walkUntil(VDirection.Down, root, n => collect((r1, r2) => GeomClientRect.isBelow(r1, r2), n), targetNodeRect.node);

        return clientRects;
    }

    static __caretInfo(clientRect, clientX) {
        return {
            node: clientRect.node,
            before: this.__distanceToRectLeft(clientRect, clientX) < this.__distanceToRectRight(clientRect, clientX)
        };
    };

    static __distanceToRectLeft(clientRect, clientX) {
        return Math.abs(clientRect.left - clientX);
    }

    static __distanceToRectRight(clientRect, clientX) {
        return Math.abs(clientRect.right - clientX);
    }

    static __getFakeCaretTargets(root) {
        return Tools.filter(Tools.from(root.getElementsByTagName('*')), n => FakeCaret.isFakeCaretTarget(n));
    }

    static __isInside(clientX, clientRect) {
        return clientX >= clientRect.left && clientX <= clientRect.right;
    }

    static __walkUntil(direction, root, predicateFn, node) {
        while ((node = CaretUtils.findNode(node, direction, (n, r) => CaretCandidate.isEditableCaretCandidate(n, r), root))) {
            if (predicateFn(node)) {
                return;
            }
        }
    }
}
