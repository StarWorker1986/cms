export class Cell {
    constructor(initial) {
        this.value = initial;
    }

    get() {
        return this.value;
    }

    set(v) {
        this.value = v;
    }

    clone() {
        return new Cell(this.get());
    }
}