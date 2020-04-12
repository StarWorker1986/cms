import Option from "../util/Option";
import Tools from "../util/Tools";
import NodeType from "../dom/NodeType";
import DOMUtils from "../dom/DOMUtils";

export default class FontInfo {
    static getFontSize(rootElm, elm) {
        return this.__getFontProp("font-size")(rootElm, elm);
    }

    static getFontFamily(rootElm, elm) {
        let family = this.__getFontProp("font-family")(rootElm, elm);
        return family.replace(/[\'\"\\]/g, '').replace(/,\s+/g, ',');
    }

    static toPt(fontSize, precision) {
        if (/[0-9.]+px$/.test(fontSize)) {
            return this.__round(parseInt(fontSize, 10) * 72 / 96, precision || 0) + "pt";
        }
        return fontSize;
    }

    static __getFontProp(propName) {
        return (rootElm, elm) => {
            return Option.from(elm).map(DOMUtils.fromDom).filter(NodeType.isElement).bind((element) => {
                return this.__getSpecifiedFontProp(propName, rootElm, element.dom())
                           .or(this.__getComputedFontProp(propName, element.dom()));
            }).getOr('');
        };
    }

    static __getComputedFontProp(propName, elm) {
        return Option.from(DOMUtils.DOM.getStyle(elm, propName, true));
    }

    static __getSpecifiedFontProp(propName, rootElm, elm) {
        let getProperty = (elm) => DOMUtils.getRawCss(elm, propName),
            isRoot = (elm) => DOMUtils.eq(DOMUtils.fromDom(rootElm), elm);
        return DOMUtils.closest(DOMUtils.fromDom(elm), (elm) => getProperty(elm).isSome(), isRoot).bind(getProperty);
    }

    static __round(number, precision) {
        let factor = Math.pow(10, precision);
        return Math.round(number * factor) / factor;
    }
}