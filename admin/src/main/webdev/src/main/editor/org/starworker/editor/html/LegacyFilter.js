import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import Styles from "./Styles";

export default class LegacyFilter {
    register(domParser, settings) {
        if (settings.inlineStyles) {
            this.__addFilters(domParser, settings);
        }
    }

    __addFilters(domParser, settings) {
        let styles = new Styles();
        if (settings.convertFontsToSpans) {
            this.__addFontToSpansFilter(domParser, styles, ArrUtils.explode(settings.fontSizeLegacyValues));
        }
        this.__addStrikeToSpanFilter(domParser, styles);
    }

    __addFontToSpansFilter(domParser, styles, fontSizes) {
        domParser.addNodeFilter("font", (nodes) => {
            Tools.each(nodes, (node) => {
                let props = styles.parse(node.attr("style")), color = node.attr("color"),
                    face = node.attr("face"), size = node.attr("size");

                if (color) {
                    props.color = color;
                }

                if (face) {
                    props["font-family"] = face;
                }

                if (size) {
                    props["font-size"] = fontSizes[parseInt(node.attr("size"), 10) - 1];
                }

                node.name = "span";
                node.attr("style", styles.serialize(props));
                this.__removeAttrs(node, ["color", "face", "size"]);
            });
        });
    }

    __addStrikeToSpanFilter(domParser, styles) {
        domParser.addNodeFilter("strike", (nodes) => {
            Tools.each(nodes, (node) => {
                let props = styles.parse(node.attr("style"));
                props["text-decoration"] = "line-through";
                node.name = "span";
                node.attr("style", styles.serialize(props));
            });
        });
    }

    __removeAttrs(node, names) {
        Tools.each(names, (name) => node.attr(name, null));
    }
}