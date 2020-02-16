export class Strings {
    static contains(str, substr) {
        return str.indexOf(substr) !== -1;
    }

    static trim(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }

    static lTrim(str) {
        return str.replace(/^\s+/g, '');
    }

    static rTrim(str) {
        return str.replace(/\s+$/g, '');
    }
}