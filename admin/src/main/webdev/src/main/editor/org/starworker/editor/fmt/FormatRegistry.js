import DefaultFormats from "./DefaultFormats";
import ArrUtils from "../util/ArrUtils";
import Tools from "../util/Tools";

export default class FormatRegistry {
    constructor(editor) {
        this._formats = {};
        this.register(DefaultFormats.get(editor.dom));
        this.register(editor.settings.formats);
    }

    get(name) {
        return name ? this._formats[name] : this._formats;
    }

    has(name) {
        return Object.hasOwnProperty.call(this._formats, name);
    }

    register(name, format) {
        if (name) {
            if (typeof name !== "string") {
                ArrUtils.each(name, (f, n) => {
                    this.register(n, f);
                });
            }
            else {
                if (!Tools.isArray(format)) {
                    format = [format];
                }

                ArrUtils.each(format, (format) => {
                    if (typeof format.deep === "undefined") {
                        format.deep = !format.selector;
                    }

                    if (typeof format.split === "undefined") {
                        format.split = !format.selector || format.inline;
                    }

                    if (typeof format.remove === "undefined" && format.selector && !format.inline) {
                        format.remove = "none";
                    }

                    if (format.selector && format.inline) {
                        format.mixed = true;
                        format.blockExpand = true;
                    }

                    // Split classes if needed
                    if (typeof format.classes === "string") {
                        format.classes = format.classes.split(/\s+/);
                    }
                });

                this._formats[name] = format;
            }
        }
    }

    unregister(name) {
        if (name && this._formats[name]) {
            delete this._formats[name];
        }
        return this._formats;
    }
}