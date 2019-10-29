export default class Zwsp {
    static isZwsp(chr) {
        return chr === Zwsp.ZWSP;
    }

    static trim(text) {
        return text.replace(new RegExp(Zwsp.ZWSP, 'g'), '');
    }

    static get ZWSP() {
        return '\uFEFF';
    }
}