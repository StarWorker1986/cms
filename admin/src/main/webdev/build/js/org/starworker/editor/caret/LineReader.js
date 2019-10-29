class LineReader {
    static getPositionsUntilPreviousLine(scope, currentPos) {
        return this.__getPositionsUntil((p1, p2) => CaretPosition.isAbove(p1, p2), -1, scope, currentPos);
    }

    static getPositionsUntilNextLine(scope, currentPos) {
        return this.__getPositionsUntil((p1, p2) => CaretPosition.isBelow(p1, p2), 1, scope, currentPos);
    }

    static getPositionsAbove(scope, currentPos) {
        return this.__getAdjacentLinePositions(-1, (s, p) => this.getPositionsUntilPreviousLine(s, p), scope, currentPos);
    }

    static getPositionsBelow(scope, currentPos) {
        return this.__getAdjacentLinePositions(1, (s, p) => this.getPositionsUntilNextLine(s, p), scope, currentPos);
    }

    static findClosestHorizontalPosition(positions, pos) {
        return Tools.head(pos.getClientRects()).bind((targetRect) => {
            return this.findClosestHorizontalPositionFromPoint(positions, targetRect.left);
        });
    }

    static findClosestHorizontalPositionFromPoint(positions, x) {
        return Tools.foldl(positions, (acc, newPos) => {
            return acc.fold(
                () => {
                    return Option.some(newPos);
                },
                (lastPos) => {
                    return Option.liftN([Tools.head(lastPos.getClientRects()), Tools.head(newPos.getClientRects())], (lastRect, newRect) => {
                        let lastDist = Math.abs(x - lastRect.left), newDist = Math.abs(x - newRect.left);
                        return newDist <= lastDist ? newPos : lastPos;
                    }).or(acc);
                });
        }, Option.none());
    }

    static getFirstLinePositions(scope) {
        return CaretFinder.firstPositionIn(scope).map((pos) => {
            return [pos].concat(this.getPositionsUntilNextLine(scope, pos).positions);
        }).getOr([]);
    }

    static getLastLinePositions(scope) {
        return CaretFinder.lastPositionIn(scope).map((pos) => {
            return this.getPositionsUntilPreviousLine(scope, pos).positions.concat(pos);
        }).getOr([]);
    }

    static getClosestPositionAbove(scope, pos) {
        return this.findClosestHorizontalPosition(this.getPositionsAbove(scope, pos), pos);
    }

    static getClosestPositionBelow(scope, pos) {
        return this.findClosestHorizontalPosition(this.getPositionsBelow(scope, pos), pos);
    }

    static isAtFirstLine(scope, pos) {
        return this.getPositionsUntilPreviousLine(scope, pos).breakAt.isNone();
    }

    static isAtLastLine(scope, pos) { 
        return this.getPositionsUntilNextLine(scope, pos).breakAt.isNone();
    }

    static __getPositionsUntil(predicate, direction, scope, start) {
        let caretWalker = new CaretWalker(scope), currentPos = start, nextPos, positions = [];

        while (currentPos) {
            nextPos = this.__walk(direction, caretWalker, currentPos);
            if (!nextPos) {
                break;
            }

            if (NodeType.isBr(nextPos.getNode(false))) {
                if (direction === HDirection.Forwards) {
                    return {
                        positions: this.__flip(direction, positions).concat([nextPos]),
                        breakType: BreakType.Br,
                        breakAt: Option.some(nextPos)
                    };
                }
                else {
                    return { 
                        positions: this.__flip(direction, positions),
                        breakType: BreakType.Br,
                        breakAt: Option.some(nextPos) 
                    };
                }
            }

            if (!nextPos.isVisible()) {
                currentPos = nextPos;
                continue;
            }

            if (predicate(currentPos, nextPos)) {
                let breakType = this.__getBreakType(scope, direction, currentPos, nextPos);
                return {
                    positions: this.__flip(direction, positions),
                    breakType: breakType,
                    breakAt: Option.some(nextPos)
                };
            }

            positions.push(nextPos);
            currentPos = nextPos;
        }
        return {
            positions: this.__flip(direction, positions),
            breakType: BreakType.Eol,
            breakAt: Option.none()
        };
    }

    static __walk(direction, caretWalker, pos) {
        return direction === HDirection.Forwards ? caretWalker.next(pos) : caretWalker.prev(pos);
    }

    static __flip(direction, positions) {
        return direction === HDirection.Backwards ? positions.reverse() : positions;
    }

    static __getBreakType(scope, direction, currentPos, nextPos) {
        if (NodeType.isBr(nextPos.getNode(direction === HDirection.Forwards))) {
            return BreakType.Br;
        }
        else if (CaretUtils.isInSameBlock(currentPos, nextPos) === false) {
            return BreakType.Block;
        }
        else {
            return BreakType.Wrap;
        }
    }

    static __getAdjacentLinePositions(direction, getPositionsUntilBreak, scope, currentPos) {
        return getPositionsUntilBreak(scope, currentPos).breakAt.map((pos) => {
            let positions = getPositionsUntilBreak(scope, pos).positions;
            return direction === HDirection.Backwards ? positions.concat(pos) : [pos].concat(positions);
        }).getOr([]);
    }
}
