import Tools from "./Tools";

export default class I18n {
    constructor() {
        this._currentCode = "en";
        this._data = {};
    }

    setCode(newCode) {
        if (newCode) {
            this._currentCode = newCode;
        }
    }

    getCode() {
        return this._currentCode;
    }

    hasCode(code) {
        return Tools.has(this._data, code);
    }

    isRtl() {
        return Tools.get(this._data, this._currentCode)
                    .bind((items) => Tools.get(items, "_dir"))
                    .exists((dir) => dir === "rtl");
    }

    add(code, items) {
        let langData = this._data[code];

        if (!langData) {
            this._data[code] = langData = {};
        }
        for (let name in items) {
            langData[name.toLowerCase()] = items[name];
        }
    }

    translate(text) {
        // empty strings
        if (text === '' || text === null || text === undefined) {
            return '';
        }

        // Raw, already translated
        if (Tools.isObject(text) && Tools.has(text, "raw")) {
            return Tools.toString(text.raw);
        }

        // Tokenised {translations}
        if (Tools.isArray(text) && text.length > 1) {
            let value = text.slice(1), substitued = this.__getLangData(text[0]);

            substitued = substitued.replace(/\{([0-9]+)\}/g, ($1, $2) => Tools.has(value, $2) ? Tools.toString(value[$2]) : $1)
                                   .replace(/{context:\w+}$/, '');
            return substitued;
        }
        // straight forward translation mapping
        return this.__getLangData(text).replace(/{context:\w+}$/, '');
    }

    static get i18n() {
        return new I18n();
    }

    __getLangData(text) {
        // make sure we work on a string and return a string
        let textstr = Tools.toString(text),
            lowercaseTextstr = textstr.toLowerCase(),
            langData = this._data[this._currentCode] || {};
        return Tools.has(langData, lowercaseTextstr) ? Tools.toString(langData[lowercaseTextstr]) : textstr;
    }
}