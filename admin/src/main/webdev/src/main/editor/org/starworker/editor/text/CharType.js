export default class CharType {
    static isNbsp(chr) {
        return chr === '\u00a0';
    }

    static isWhiteSpace(chr) {
        return /^[\r\n\t ]$/.test(chr);
    }

    static isContent(chr) {
        return !this.isWhiteSpace(chr) && !this.isNbsp(chr); 
    }

    static __is(expected) {
        return actual => expected === actual; 
    }
}