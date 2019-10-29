class CaretUtils {
    static getElementFromPosition(pos) { 
        return Option.from(pos.getNode()).map(DOMUtils.fromDom); 
    }

    static getEditingHost(node, rootNode) {
        for (node = node.parentNode; node && node !== rootNode; node = node.parentNode) {
            if (NodeType.isContentEditableTrue(node)) {
                return node;
            }
        }
        return rootNode;
    }
    
    static getParentBlock(node, rootNode) {
        let isBlockLike = NodeType.matchStyleValues("display", "block table table-cell table-caption list-item");

        while (node && node !== rootNode) {
            if (isBlockLike(node)) {
                return node;
            }
            node = node.parentNode;
        }

        return null;
    }

    static isAfterContentEditableFalse(caretPosition) {
        return this.__isNextToContentEditableFalse(-1, caretPosition);
    }

    static isAfterTable(caretPosition) {
        return this.__isNextToTable(-1, caretPosition);
    }

    static isBackwards(direction) {
        return direction < 0;
    }

    static isBeforeContentEditableFalse(caretPosition) {
        return this.__isNextToContentEditableFalse(0, caretPosition);
    }

    static isBeforeSpace(pos) {
        return this.__isChar(true, CharType.isWhiteSpace, pos);
    }

    static isAfterSpace(pos) {
        return this.__isChar(false, CharType.isWhiteSpace, pos);
    }

    static isBeforeTable(caretPosition) {
        return this.__isNextToTable(0, caretPosition);
    }

    static isForwards(direction) { 
        return direction > 0; 
    }

    static isInSameBlock(caretPosition1, caretPosition2, rootNode) {
        return this.getParentBlock(caretPosition1.container, rootNode) === this.getParentBlock(caretPosition2.container, rootNode);
    }

    static isInSameEditingHost(caretPosition1, caretPosition2, rootNode) {
        return this.getEditingHost(caretPosition1.container, rootNode) === this.getEditingHost(caretPosition2.container, rootNode);
    }

    static isMoveInsideSameBlock(from, to) {
        let inSameBlock = this.isInSameBlock(from, to);
        if (!inSameBlock && NodeType.isBr(from.getNode())) {
            return true;
        }
        return inSameBlock;
    }

    static findNode(node, direction, predicateFn, rootNode, shallow) {
        let walker = new TreeWalker(node, rootNode);

        if (this.isBackwards(direction)) {
            if (NodeType.isContentEditableFalse(node) || CaretContainer.isCaretContainerBlock(node)) {
                node = this.__skipCaretContainers(walker, true, true);
                if (predicateFn(node)) {
                    return node;
                }
            }

            while ((node = this.__skipCaretContainers(walker, true, shallow))) {
                if (predicateFn(node)) {
                    return node;
                }
            }
        }

        if (this.isForwards(direction)) {
            if (NodeType.isContentEditableFalse(node) || CaretContainer.isCaretContainerBlock(node)) {
                node = this.__skipCaretContainers(walker, false, true);
                if (predicateFn(node)) {
                    return node;
                }
            }
            while ((node = this.__skipCaretContainers(walker, false, shallow))) {
                if (predicateFn(node)) {
                    return node;
                }
            }
        }

        return null;
    }

    static getElementFromPosition(pos) {
        return Option.from(pos.getNode()).map(DOMUtils.fromDom); 
    }

    static getElementFromPrevPosition (pos) {
        return Option.from(pos.getNode(true)).map(DOMUtils.fromDom);
    }

    static getNormalizedRangeEndPoint(direction, root, range) {
        let normalizedRange = this.normalizeRange(direction, root, range);
        if (direction === -1) {
            return CaretPosition.fromRangeStart(normalizedRange);
        }
        return CaretPosition.fromRangeEnd(normalizedRange);
    }

    static getRelativeCefElm(forward, caretPosition) {
        return Option.from(this.__getChildNodeAtRelativeOffset(forward ? 0 : -1, caretPosition)).filter(NodeType.isContentEditableFalse);
    }

    static getVisualCaretPosition(walkFn, caretPosition) {
        while ((caretPosition = walkFn(caretPosition))) {
            if (caretPosition.isVisible()) {
                return caretPosition;
            }
        }
        return caretPosition;
    }

    static normalizeRange(direction, root, range) {
        let node, container, offset, location;

        let leanLeft = node => this.__lean(true, root, node),
            leanRight = node => this.__lean(false, root, node),
            before = node => this.__beforeAfter(true, node),
            after = node => this.__beforeAfter(false, node);

        container = range.startContainer;
        offset = range.startOffset;

        if (CaretContainer.isCaretContainerBlock(container)) {
            if (!NodeType.isElement(container)) {
                container = container.parentNode;
            }

            location = container.getAttribute("data-editor-caret");
            if (location === "before") {
                node = container.nextSibling;
                if (FakeCaret.isFakeCaretTarget(node)) {
                    return before(node);
                }
            }
            if (location === "after") {
                node = container.previousSibling;
                if (FakeCaret.isFakeCaretTarget(node)) {
                    return after(node);
                }
            }
        }

        if (!range.collapsed) {
            return range;
        }

        if (NodeType.isText(container)) {
            if (CaretContainer.isCaretContainer(container)) {
                if (direction === 1) {
                    node = leanRight(container);
                    if (node) {
                        return before(node);
                    }

                    node = leanLeft(container);
                    if (node) {
                        return after(node);
                    }
                }

                if (direction === -1) {
                    node = leanLeft(container);
                    if (node) {
                        return after(node);
                    }

                    node = leanRight(container);
                    if (node) {
                        return before(node);
                    }
                }

                return range;
            }

            if (CaretContainer.endsWithCaretContainer(container) && offset >= container.data.length - 1) {
                if (direction === 1) {
                    node = leanRight(container);
                    if (node) {
                        return before(node);
                    }
                }
                return range;
            }

            if (CaretContainer.startsWithCaretContainer(container) && offset <= 1) {
                if (direction === -1) {
                    node = leanLeft(container);
                    if (node) {
                        return after(node);
                    }
                }
                return range;
            }

            if (offset === container.data.length) {
                node = leanRight(container);
                if (node) {
                    return before(node);
                }
                return range;
            }

            if (offset === 0) {
                node = leanLeft(container);
                if (node) {
                    return after(node);
                }
                return range;
            }
        }

        return range;
    }

    static __beforeAfter(before, node) {
        let range = node.ownerDocument.createRange();

        if (before) {
            range.setStartBefore(node);
            range.setEndBefore(node);
        }
        else {
            range.setStartAfter(node);
            range.setEndAfter(node);
        }

        return range;
    }

    static __getChildNodeAtRelativeOffset(relativeOffset, caretPosition) {
        if (!caretPosition) {
            return null;
        }

        let container = caretPosition.container, offset = caretPosition.offset;
        if (!NodeType.isElement(container)) {
            return null;
        }

        return container.childNodes[offset + relativeOffset];
    }

    static __isChar(forward, predicate, pos) {
        return Option.from(pos.container).filter(NodeType.isText).exists((text) => {
            let delta = forward ? 0 : -1;
            return predicate(text.data.charAt(pos.offset + delta));
        });
    }

    static __isNextToTable(relativeOffset, caretPosition) {
        return NodeType.isTable(this.__getChildNodeAtRelativeOffset(relativeOffset, caretPosition));
    }

    static __isNextToContentEditableFalse(relativeOffset, caretPosition) {
        let node = this.__getChildNodeAtRelativeOffset(relativeOffset, caretPosition);
        return NodeType.isContentEditableFalse(node) && !NodeType.isBogusAll(node);
    }

    static __isNodesInSameBlock(root, node1, node2) {
        return this.getParentBlock(node1, root) === this.getParentBlock(node2, root);
    }

    static __lean(left, root, node) {
        let sibling, siblingName;
        
        if (left) {
            siblingName = "previousSibling";
        }
        else {
            siblingName = "nextSibling";
        }

        while (node && node !== root) {
            sibling = node[siblingName];
            if (CaretContainer.isCaretContainer(sibling)) {
                sibling = sibling[siblingName];
            }

            if (NodeType.isContentEditableFalse(sibling)) {
                if (this.__isNodesInSameBlock(root, sibling, node)) {
                    return sibling;
                }
                break;
            }

            if (CaretCandidate.isCaretCandidate(sibling)) {
                break;
            }

            node = node.parentNode;
        }

        return null;
    }

    static __skipCaretContainers(walker, fromPrev, shallow) {
        let node;

        while (node = (fromPrev ? walker.prev(shallow) : walker.next(shallow))) {
            if (!CaretContainer.isCaretContainerBlock(node)) {
                return node;
            }
        }

        return null;
    }
}