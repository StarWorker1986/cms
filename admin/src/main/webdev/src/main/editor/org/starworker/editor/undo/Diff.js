export default class Diff {
    static get KEEP() {
        return 0;
    }
    
    static get INSERT() {
        return 1;
    }
    
    static get DELETE() {
        return 2;
    }

    static diff(left, right) {
        let script = [];
        this.__buildScript(left, right, 0, left.length, 0, right.length, script);
        return script;
    }

    static __buildSnake(left, right, start, diag, end1, end2) {
        let end = start;
        while (end - diag < end2 && end < end1 && left[end] === right[end - diag]) {
            ++end;
        }
        return this.__snake(start, end, diag);
    }

    static __buildScript(left, right, start1, end1, start2, end2, script) {
        let middle = this.__getMiddleSnake(left, right, start1, end1, start2, end2);

        if (middle === null || middle.start === end1 && middle.diag === end1 - end2 ||
            middle.end === start1 && middle.diag === start1 - start2) {
            
            let i = start1, j = start2;
            while (i < end1 || j < end2) {
                if (i < end1 && j < end2 && left[i] === right[j]) {
                    script.push([this.KEEP, left[i]]);
                    ++i;
                    ++j;
                }
                else {
                    if (end1 - start1 > end2 - start2) {
                        script.push([this.DELETE, left[i]]);
                        ++i;
                    }
                    else {
                        script.push([this.INSERT, right[j]]);
                        ++j;
                    }
                }
            }
        }
        else {
            this.__buildScript(left, right, start1, middle.start, start2, middle.start - middle.diag, script);
            for (let i2 = middle.start; i2 < middle.end; ++i2) {
                script.push([this.KEEP, left[i2]]);
            }
            this.__buildScript(left, right, middle.end, end1, middle.end - middle.diag, end2, script);
        }
    }

    static __getMiddleSnake(left, right, start1, end1, start2, end2) {
        // Myers Algorithm
        // Initialisations
        let size = left.length + right.length + 2,
            vDown = new Array(size), vUp = new Array(size),
            m = end1 - start1, n = end2 - start2;

        if (m === 0 || n === 0) {
            return null;
        }

        let delta = m - n, sum = n + m, offset = (sum % 2 === 0 ? sum : sum + 1) / 2;

        vDown[1 + offset] = start1;
        vUp[1 + offset] = end1 + 1;

        let d, k, i, x, y;
        for (d = 0; d <= offset; ++d) {
            // Down
            for (k = -d; k <= d; k += 2) {
                // First step
                i = k + offset;
                if (k === -d || k !== d && vDown[i - 1] < vDown[i + 1]) {
                    vDown[i] = vDown[i + 1];
                }
                else {
                    vDown[i] = vDown[i - 1] + 1;
                }

                x = vDown[i];
                y = x - start1 + start2 - k;
                while (x < end1 && y < end2 && left[x] === right[y]) {
                    vDown[i] = ++x;
                    ++y;
                }

                // Second step
                if (delta % 2 !== 0 && delta - d <= k && k <= delta + d) {
                    if (vUp[i - delta] <= vDown[i]) {
                        return this.__buildSnake(left, right, vUp[i - delta], k + start1 - start2, end1, end2);
                    }
                }
            }

            // Up
            for (k = delta - d; k <= delta + d; k += 2) {
                // First step
                i = k + offset - delta;
                if (k === delta - d || k !== delta + d && vUp[i + 1] <= vUp[i - 1]) {
                    vUp[i] = vUp[i + 1] - 1;
                }
                else {
                    vUp[i] = vUp[i - 1];
                }

                x = vUp[i] - 1;
                y = x - start1 + start2 - k;
                while (x >= start1 && y >= start2 && left[x] === right[y]) {
                    vUp[i] = x--;
                    y--;
                }

                // Second step
                if (delta % 2 === 0 && -d <= k && k <= d) {
                    if (vUp[i] <= vDown[i + delta]) {
                        return this.__buildSnake(left, right, vUp[i], k + start1 - start2, end1, end2);
                    }
                }
            }
        }
    }

    static __snake(start, end, diag) {
        return {
            start: start,
            end: end,
            diag: diag
        };
    }
}