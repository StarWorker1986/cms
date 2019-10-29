const round = Math.round;

class GeomClientRect {
    static clone(rect) {
        if (!rect) {
            return { 
                left: 0, top: 0, bottom: 0, right: 0, width: 0, height: 0 
            };
        }
        
        return {
            left: round(rect.left),
            top: round(rect.top),
            bottom: round(rect.bottom),
            right: round(rect.right),
            width: round(rect.width),
            height: round(rect.height)
        };
    }

    static collapse(rect, toStart) {
        rect = this.clone(rect);

        if (toStart) {
            rect.right = rect.left;
        }
        else {
            rect.left = rect.left + rect.width;
            rect.right = rect.left;
        }
        rect.width = 0;

        return rect;
    }

    static isEqual(rect1, rect2) {
        return rect1.left === rect2.left
            && rect1.top === rect2.top
            && rect1.bottom === rect2.bottom
            && rect1.right === rect2.right;
    }

    static isValidOverflow(overflowY, rect1, rect2) {
        return overflowY >= 0 && overflowY <= Math.min(rect1.height, rect2.height) / 2;
    }

    static isAbove(rect1, rect2) {
        if ((rect1.bottom - rect1.height / 2) < rect2.top) {
            return true;
        }
        if (rect1.top > rect2.bottom) {
            return false;
        }
        return this.isValidOverflow(rect2.top - rect1.bottom, rect1, rect2);
    }

    static isBelow(rect1, rect2) {
        if (rect1.top > rect2.bottom) {
            return true;
        }

        if (rect1.bottom < rect2.top) {
            return false;
        }

        return this.isValidOverflow(rect2.bottom - rect1.top, rect1, rect2);
    }

    static isLeft = function (rect1, rect2) { 
        return rect1.left < rect2.left; 
    }

    static isRight = function (rect1, rect2) { 
        return rect1.right > rect2.right; 
    }

    static compare = function (rect1, rect2) {
        if (this.isAbove(rect1, rect2)) {
            return -1;
        }

        if (this.isBelow(rect1, rect2)) {
            return 1;
        }

        if (this.isLeft(rect1, rect2)) {
            return -1;
        }

        if (this.isRight(rect1, rect2)) {
            return 1;
        }

        return 0;
    }

    static containsXY(rect, clientX, clientY) {
        return clientX >= rect.left 
            && clientX <= rect.right 
            && clientY >= rect.top 
            && clientY <= rect.bottom;
    }

    static overflowX(outer, inner) {
        if (inner.left > outer.left && inner.right < outer.right) {
            return 0;
        }
        else {
            return inner.left < outer.left ? (inner.left - outer.left) : (inner.right - outer.right);
        }
    }

    static overflowY(outer, inner) {
        if (inner.top > outer.top && inner.bottom < outer.bottom) {
            return 0;
        }
        else {
            return inner.top < outer.top ? (inner.top - outer.top) : (inner.bottom - outer.bottom);
        }
    }

    static getOverflow(outer, inner) {
        return { x: overflowX(outer, inner), y: overflowY(outer, inner) };
    }
}