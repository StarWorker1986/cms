class LineWalker {
    static downUntil(root, predicateFn, caretPosition) {
        return this.__walkUntil(VDirection.Down, (r1, r2) => GeomClientRect.isBelow(r1, r2), (r1, r2) => GeomClientRect.isAbove(r1, r2), root, predicateFn, caretPosition);
    }

    static isAboveLine(lineNumber) {
        let aboveLineNumber = (lineNumber, clientRect) => clientRect.line > lineNumber;
        return (clientRect) => {
            return aboveLineNumber(lineNumber, clientRect);
        };
    }

    static isLine = (lineNumber) => {
        let isLineNumber = (lineNumber, clientRect) => clientRect.line === lineNumber;
        return (clientRect) => {
            return isLineNumber(lineNumber, clientRect);
        };
    }

    static positionsUntil(direction, root, predicateFn, node) {
        let caretWalker = new CaretWalker(root), walkFn, isBelowFn, isAboveFn, caretPosition, result = [], 
            line = 0, clientRect, targetClientRect;
        
        let getClientRect = (caretPosition) => {
            if (direction === 1) {
                return ArrUtils.last(caretPosition.getClientRects());
            }
            return ArrUtils.last(caretPosition.getClientRects());
        };

        if (direction === 1) {
            walkFn = p => caretWalker.next(p);
            isBelowFn = (c, t) => GeomClientRect.isBelow(c, t);
            isAboveFn = (c, t) => GeomClientRect.isAbove(c, t);
            caretPosition = CaretPosition.after(node);
        }
        else {
            walkFn = p => caretWalker.prev(p);
            isBelowFn = (c, t) => GeomClientRect.isAbove(c, t);
            isAboveFn = (c, t) => GeomClientRect.isBelow(c, t);
            caretPosition = CaretPosition.before(node);
        }
        targetClientRect = getClientRect(caretPosition);
        do {
            if (!caretPosition.isVisible()) {
                continue;
            }

            clientRect = getClientRect(caretPosition);
            if (isAboveFn(clientRect, targetClientRect)) {
                continue;
            }

            if (result.length > 0 && isBelowFn(clientRect, ArrUtils.last(result))) {
                line++;
            }

            clientRect = GeomClientRect.clone(clientRect);
            clientRect.position = caretPosition;
            clientRect.line = line;
            
            if (predicateFn(clientRect)) {
                return result;
            }

            result.push(clientRect);
        } while ((caretPosition = walkFn(caretPosition)));

        return result;
    }

    static upUntil(root, predicateFn, caretPosition) {
        return this.__walkUntil(VDirection.Up, (r1, r2) => GeomClientRect.isAbove(r1, r2), (r1, r2) => GeomClientRect.isBelow(r1, r2), root, predicateFn, caretPosition);
    }

    static __walkUntil(direction, isAboveFn, isBelowFn, root, predicateFn, caretPosition) {
        let line = 0, node, result = [], targetClientRect;
        let add = (node) => {
            let i, clientRect, clientRects = Dimensions.getClientRects([node]);

            if (direction === -1) {
                clientRects = clientRects.reverse();
            }

            for (i = 0; i < clientRects.length; i++) {
                clientRect = clientRects[i];
                if (isBelowFn(clientRect, targetClientRect)) {
                    continue;
                }

                if (result.length > 0 && isAboveFn(clientRect, ArrUtils.last(result))) {
                    line++;
                }

                clientRect.line = line;
                if (predicateFn(clientRect)) {
                    return true;
                }

                result.push(clientRect);
            }
        };

        targetClientRect = ArrUtils.last(caretPosition.getClientRects());
        if (!targetClientRect) {
            return result;
        }

        node = caretPosition.getNode();
        add(node);
        this.__findUntil(direction, root, add, node);
        return result;
    }

    static __findUntil(direction, root, predicateFn, node) {
        while ((node = CaretUtils.findNode(node, direction, (n, r) => CaretCandidate.isEditableCaretCandidate(n, r), root))) {
            if (predicateFn(node)) {
                return;
            }
        }
    }
}
