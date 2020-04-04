import DOMUtils from "../dom/DOMUtils";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import Schema from "../html/Schema";

export default class Preview {
    static getCssText(editor, format) {
        let dom = DOMUtils.DOM, name, previewFrag, previewElm, items, previewCss = '', parentFontSize, previewStyles;

        previewStyles = editor.settings.previewStyles;

        // No preview forced
        if (previewStyles === false) {
            return '';
        }

        // Default preview
        if (typeof previewStyles !== "string") {
            previewStyles = "font-family font-size font-weight font-style text-decoration " +
                            "text-transform color background-color border border-radius outline text-shadow";
        }

        // Removes any variables since these can"t be previewed
        let removeVars = (val) => val.replace(/%(\w+)/g, '');

        // Create block/inline element to use for preview
        if (typeof format === "string") {
            format = editor.formatter.get(format);
            if (!format) {
                return;
            }
            format = format[0];
        }

        // TODO: This should probably be further reduced by the previewStyles option
        if ("preview" in format) {
            previewStyles = format.preview;
            if (previewStyles === false) {
                return '';
            }
        }

        name = format.block || format.inline || "span";
        items = this.parseSelector(format.selector);

        if (items.length) {
            if (!items[0].name) {
                items[0].name = name;
            }
            name = format.selector;
            previewFrag = this.__parsedSelectorToHtml(items, editor);
        }
        else {
            previewFrag = this.__parsedSelectorToHtml([name], editor);
        }

        previewElm = dom.select(name, previewFrag)[0] || previewFrag.firstChild;
        // Add format styles to preview element
        ArrUtils.each(format.styles, (value, name) => {
            value = removeVars(value);
            if (value) {
                dom.setStyle(previewElm, name, value);
            }
        });

        // Add attributes to preview element
        ArrUtils.each(format.attributes, (value, name) => {
            value = removeVars(value);
            if (value) {
                dom.setAttrib(previewElm, name, value);
            }
        });

        // Add classes to preview element
        ArrUtils.each(format.classes, (value) => {
            value = removeVars(value);
            if (!dom.hasClass(previewElm, value)) {
                dom.addClass(previewElm, value);
            }
        });

        editor.fire("PreviewFormats");
        dom.setStyles(previewFrag, { position: "absolute", left: -0xFFFF });
        editor.getBody().appendChild(previewFrag);

        // Get parent container font size so we can compute px values out of em/% for older IE:s
        parentFontSize = dom.getStyle(editor.getBody(), "fontSize", true);
        parentFontSize = /px$/.test(parentFontSize) ? parseInt(parentFontSize, 10) : 0;

        ArrUtils.each(previewStyles.split(' '), (name) => {
            let value = dom.getStyle(previewElm, name, true);
            
            // If background is transparent then check if the body has a background color we can use
            if (name === "background-color" && /transparent|rgba\s*\([^)]+,\s*0\)/.test(value)) {
                value = dom.getStyle(editor.getBody(), name, true);
                // Ignore white since it"s the default color, not the nicest fix
                // TODO: Fix this by detecting runtime style
                if (dom.toHex(value).toLowerCase() === "#ffffff") {
                    return;
                }
            }

            if (name === "color") {
                // Ignore black since it"s the default color, not the nicest fix
                // TODO: Fix this by detecting runtime style
                if (dom.toHex(value).toLowerCase() === "#000000") {
                    return;
                }
            }

            // Old IE won"t calculate the font size so we need to do that manually
            if (name === "font-size") {
                if (/em|%$/.test(value)) {
                    if (parentFontSize === 0) {
                        return;
                    }

                    // Convert font size from em/% to px
                    let numValue = parseFloat(value) / (/%$/.test(value) ? 100 : 1);
                    value = (numValue * parentFontSize) + "px";
                }
            }

            if (name === "border" && value) {
                previewCss += "padding:0 2px;";
            }

            previewCss += name + ":" + value + ";";
        });

        editor.fire("AfterPreviewFormats");
        dom.remove(previewFrag);

        return previewCss;
    }

    static parseSelector(selector) {
        if (!selector || typeof selector !== "string") {
            return [];
        }

        selector = selector.split(/\s*,\s*/)[0];
        selector = selector.replace(/\s*(~\+|~|\+|>)\s*/g, "$1");

        return Tools.map(selector.split(/(?:>|\s+(?![^\[\]]+\]))/), (item) => {
            // process ArrUtils.each sibling selector separately
            let siblings = Tools.map(item.split(/(?:~\+|~|\+)/), this.__parseSelectorItem),
                obj = siblings.pop(); // the last one is our real target
            if (siblings.length) {
                obj.siblings = siblings;
            }
            return obj;
        }).reverse();
    }

    static selectorToHtml(selector, editor) {
        return this.__parsedSelectorToHtml(this.parseSelector(selector), editor);
    }

    static __parseSelectorItem(item) {
        let tagName, obj = {
            classes: [],
            attrs: {}
        };

        item = obj.selector = Tools.trim(item);
        if (item !== '*') {
            // matching IDs, CLASSes, ATTRIBUTES and PSEUDOs
            tagName = item.replace(/(?:([#\.]|::?)([\w\-]+)|(\[)([^\]]+)\]?)/g, ($0, $1, $2, $3, $4) => {
                switch ($1) {
                    case '#':
                        obj.attrs.id = $2;
                        break;
                    case '.':
                        obj.classes.push($2);
                        break;
                    case ':':
                        if (ArrUtils.indexOf("checked disabled enabled read-only required".split(" "), $2) !== -1) {
                            obj.attrs[$2] = $2;
                        }
                        break;
                }

                // atribute matched
                if ($3 === '[') {
                    let m = $4.match(/([\w\-]+)(?:\=\"([^\"]+))?/);
                    if (m) {
                        obj.attrs[m[1]] = m[2];
                    }
                }

                return '';
            });
        }
        obj.name = tagName || "div";

        return obj;
    }

    static __parsedSelectorToHtml(ancestry, editor) {
        let dom = DOMUtils.DOM, elm, item, fragment, schema = editor && editor.schema || Schema({});
      
        if (ancestry && ancestry.length) {
            item = ancestry[0];
            elm = this.__createElement(item);
            fragment = dom.create("div");
            fragment.appendChild(this.__wrapInHtml(elm, ancestry.slice(1), item.siblings, schema));
            return fragment;
        }
        else {
            return '';
        }
    }

    static __createElement(sItem) {
        let dom = DOMUtils.DOM, elm;

        item = typeof sItem === "string" ? {
            name: sItem,
            classes: [],
            attrs: {}
        } : sItem;
        elm = dom.create(item.name);
        this.__decorate(elm, item);

        return elm;
    }

    static __decorate(elm, item) {
        let dom = DOMUtils.DOM;
        if (item.classes.length) {
            dom.addClass(elm, item.classes.join(' '));
        }
        dom.setAttribs(elm, item.attrs);
    }

    static __getRequiredParent(elm, candidate, schema) {
        let name = typeof elm !== "string" ? elm.nodeName.toLowerCase() : elm,
            elmRule = schema.getElementRule(name),
            parentsRequired = elmRule && elmRule.parentsRequired;

        if (parentsRequired && parentsRequired.length) {
            return candidate && Tools.inArray(parentsRequired, candidate) !== -1 ? candidate : parentsRequired[0];
        }
        else {
            return false;
        }
    }

    static __wrapInHtml(elm, ancestry, siblings, schema) {
        let parent, parentCandidate, parentRequired,
            ancestor = ancestry.length > 0 && ancestry[0],
            ancestorName = ancestor && ancestor.name;

        parentRequired = this.__getRequiredParent(elm, ancestorName, schema);
        if (parentRequired) {
            if (ancestorName === parentRequired) {
                parentCandidate = ancestry[0];
                ancestry = ancestry.slice(1);
            }
            else {
                parentCandidate = parentRequired;
            }
        }
        else if (ancestor) {
            parentCandidate = ancestry[0];
            ancestry = ancestry.slice(1);
        }
        else if (!siblings) {
            return elm;
        }
        
        if (parentCandidate) {
            parent = this.__createElement(parentCandidate);
            parent.appendChild(elm);
        }

        if (siblings) {
            if (!parent) {
                // if no more ancestry, wrap in generic div
                parent = dom.create("div");
                parent.appendChild(elm);
            }
            ArrUtils.each(siblings, (sibling) => {
                let siblingElm = this.__createElement(sibling);
                parent.insertBefore(siblingElm, elm);
            });
        }

        return this.__wrapInHtml(parent, ancestry, parentCandidate && parentCandidate.siblings, schema);
    }
}