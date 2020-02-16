export default class Styles {
    constructor(settings, schema) {
        let encodingLookup = {}, encodingItems, invisibleChar = "\uFEFF";

        this.settings = settings || {};
        this.schema = schema;

        encodingItems = ('\\" \\\' \\; \\: ; : ' + invisibleChar).split(' ');
        for (let i = 0; i < encodingItems.length; i++) {
            encodingLookup[encodingItems[i]] = invisibleChar + i;
            encodingLookup[invisibleChar + i] = encodingItems[i];
        }

        this._encodingLookup = encodingLookup;
    }

    parse(css) {
        let settings = this.settings, encodingLookup = this._encodingLookup,
            styles = {}, matches, name, value, isEncoded,
            urlConverter = settings.urlConverter,
            urlConverterScope = settings.urlConverterScope || this,
            compress = (prefix, suffix, noJoin) => this.__compress(styles, prefix, suffix, noJoin),
            compress2 = (target, a, b, c) => this.__compress2(styles, target, a, b, c),
            encode = (str) => { isEncoded = true; return encodingLookup[str]; },
            decode = (str, keepSlashes) => this.__decode(isEncoded, str, keepSlashes),
            decodeHexSequences = (value) => value.replace(/\\[0-9a-f]+/gi, (seq) => String.fromCharCode(parseInt(seq.slice(1), 16))),
            styleRegExp = /\s*([^:]+):\s*([^;]+);?/g, trimRightRegExp = /\s+$/,
            rgbRegExp = /rgb\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/gi,
            urlOrStrRegExp =  /(?:url(?:(?:\(\s*\"([^\"]+)\"\s*\))|(?:\(\s*\'([^\']+)\'\s*\))|(?:\(\s*([^)\s]+)\s*\))))|(?:\'([^\']+)\')|(?:\"([^\"]+)\")/gi,
            hex = this.__hex, invisibleChar = "\uFEFF";

        if (css) {
            css = css.replace(/[\u0000-\u001F]/g, '');

            // Encode \" \" % and ; and : inside strings so they don"t interfere with the style parsing
            css = css.replace(/\\[\"\';:\uFEFF]/g, encode).replace(/\"[^\"]+\"|\'[^\']+\'/g, (str) => {
                return str.replace(/[;:]/g, encode);
            });

            // Parse styles
            while ((matches = styleRegExp.exec(css))) {
                styleRegExp.lastIndex = matches.index + matches[0].length;
                name = matches[1].replace(trimRightRegExp, '').toLowerCase();
                value = matches[2].replace(trimRightRegExp, '');

                if (name && value) {
                    // Decode escaped sequences like \65 -> e
                    name = decodeHexSequences(name);
                    value = decodeHexSequences(value);

                    // Skip properties with double quotes and sequences like \" \" in their names
                    // See "mXSS Attacks: Attacking well-secured Web-Applications by using innerHTML Mutations"
                    // https://cure53.de/fp170.pdf
                    if (name.indexOf(invisibleChar) !== -1 || name.indexOf('"') !== -1) {
                        continue;
                    }

                    // Don"t allow behavior name or expression/comments within the values
                    if (!settings.allowScriptUrls && (name === "behavior" || /expression\s*\(|\/\*|\*\//.test(value))) {
                        continue;
                    }

                    // Opera will produce 700 instead of bold in their style values
                    if (name === "font-weight" && value === "700") {
                        value = "bold";
                    }
                    else if (name === "color" || name === "background-color") { // Lowercase colors like RED
                        value = value.toLowerCase();
                    }

                    // Convert RGB colors to HEX
                    value = value.replace(rgbRegExp, (match, r, g, b) => '#' + hex(r) + hex(g) + hex(b));
                    // Convert URLs and force them into url("value") format
                    value = value.replace(urlOrStrRegExp, (match, url, url2, url3, str, str2) => {
                        str = str || str2;
                        if (str) {
                            str = decode(str);
                            // Force strings into single quote format
                            return '\'' + str.replace(/\'/g, '\\\'') + '\'';
                        }

                        url = decode(url || url2 || url3);
                        if (!settings.allowScriptUrls) {
                            let scriptUrl = url.replace(/[\s\r\n]+/g, '');
                            if (/(java|vb)script:/i.test(scriptUrl)) {
                                return '';
                            }

                            if (!settings.allowSvgDataUrls && /^data:image\/svg/i.test(scriptUrl)) {
                                return '';
                            }
                        }

                        // Convert the URL to relative/absolute depending on config
                        if (urlConverter) {
                            url = urlConverter.call(urlConverterScope, url, "style");
                        }

                        // Output new URL format
                        return 'url(\'' + url.replace(/\'/g, '\\\'') + '\')';
                    });

                    styles[name] = isEncoded ? decode(value, true) : value;
                }
            }

            // Compress the styles to reduce it"s size for example IE will expand styles
            compress("border", '', true);
            compress("border", "-width");
            compress("border", "-color");
            compress("border", "-style");
            compress("padding", '');
            compress("margin", '');
            compress2("border", "border-width", "border-style", "border-color");

            // Remove pointless border, IE produces these
            if (styles.border === "medium none") {
                delete styles.border;
            }

            // IE 11 will produce a border-image: none when getting the style attribute from <p style="border: 1px solid red"></p>
            // So let us assume it shouldn"t be there
            if (styles["border-image"] === "none") {
                delete styles["border-image"];
            }
        }

        return styles;
    }
    
    serialize(styles, elementName) {
        let css = '', name, value, schema = this.schema, validStyles, invalidStyles;

        if (schema) {
            validStyles = schema.getValidStyles();
            invalidStyles = schema.getInvalidStyles();
        }

        let serializeStyles = (name) => this.__serializeStyles(name, validStyles),
            isValid = (name, elementName) => this.__isValid(name, elementName, invalidStyles);

        // Serialize styles according to schema
        if (elementName && validStyles) {
            // Serialize global styles and element specific styles
            serializeStyles('*');
            serializeStyles(elementName);
        }
        else {
            // Output the styles in the order they are inside the object
            for (name in styles) {
                value = styles[name];
                if (value && (!invalidStyles || isValid(name, elementName))) {
                    css += (css.length > 0 ? ' ' : '') + name + ": " + value + ';';
                }
            }
        }

        return css;
    }

    toHex(color) {
        let hex = this.__hex, rgbRegExp = /rgb\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/gi;
        return color.replace(rgbRegExp, (m, r, g, b) => '#' + hex(r) + hex(g) + hex(b));
    }
    
    __canCompress(styles, key) {
        let value = styles[key], i;
        if (!value) {
            return;
        }

        value = value.split(' ');
        i = value.length;
        while (i--) {
            if (value[i] !== value[0]) {
                return false;
            }
        }
        styles[key] = value[0];

        return true;
    }

    __compress(styles, prefix, suffix, noJoin) {
        let top, right, bottom, left;

        top = styles[prefix + "-top" + suffix];
        if (!top) {
            return;
        }

        right = styles[prefix + "-right" + suffix];
        if (!right) {
            return;
        }

        bottom = styles[prefix + "-bottom" + suffix];
        if (!bottom) {
            return;
        }

        left = styles[prefix + "-left" + suffix];
        if (!left) {
            return;
        }

        let box = [top, right, bottom, left];
        i = box.length - 1;
        while (i--) {
            if (box[i] !== box[i + 1]) {
                break;
            }
        }

        if (i > -1 && noJoin) {
            return;
        }

        styles[prefix + suffix] = i === -1 ? box[0] : box.join(" ");
        delete styles[prefix + "-top" + suffix];
        delete styles[prefix + "-right" + suffix];
        delete styles[prefix + "-bottom" + suffix];
        delete styles[prefix + "-left" + suffix];
    }

    __compress2(styles, target, a, b, c) {
        if (!this.__canCompress(styles, a)) {
            return;
        }
        if (!this.__canCompress(styles, b)) {
            return;
        }
        if (!this.__canCompress(styles, c)) {
            return;
        }

        // Compress
        styles[target] = styles[a] + ' ' + styles[b] + ' ' + styles[c];
        delete styles[a];
        delete styles[b];
        delete styles[c];
    }

    // Decodes the specified string by replacing all _<num> with it"s original value \" \" etc
    // It will also decode the \" \" if keepSlashes is set to fale or omitted
    __decode(isEncoded, str, keepSlashes) {
        if (isEncoded) {
            str = str.replace(/\uFEFF[0-9]/g, (str) => {
                return this._encodingLookup[str];
            });
        }
        if (!keepSlashes) {
            str = str.replace(/\\([\"\";:])/g, "$1");
        }

        return str;
    }
    
    __hex(val) {
        val = parseInt(val, 10).toString(16);
        return val.length > 1 ? val : "0" + val; // 0 -> 00
    }

    __isValid(name, elementName, invalidStyles) {
        let styleMap = invalidStyles['*'];

        if (styleMap && styleMap[name]) {
            return false;
        }
        styleMap = invalidStyles[elementName];
        if (styleMap && styleMap[name]) {
            return false;
        }
        return true;
    }

    __serializeStyles(name, validStyles) {
        let styleList, i, l, value;
        styleList = validStyles[name];

        if (styleList) {
            for (i = 0, l = styleList.length; i < l; i++) {
                name = styleList[i];
                value = styles[name];
                if (value) {
                    css += (css.length > 0 ? ' ' : '') + name + ": " + value + ';';
                }
            }
        }
    }
}