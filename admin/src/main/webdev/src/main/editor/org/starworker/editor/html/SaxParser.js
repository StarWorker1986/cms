import Schema from "./Schema";
import Entities from "./Entities";
import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";

export default class SaxParser {
    constructor(settings, schema) {
        if (schema === void 0) {
            this.schema = new Schema(); 
        }

        settings = settings || {};
        if (settings.fixSelfClosing !== false) {
            settings.fixSelfClosing = true;
        }
        this.settings = settings;
    }

    parse(html) {
        let noop = () => {}, settings = this.settings,
            comment = settings.comment ? settings.comment : noop,
            cdata = settings.cdata ? settings.cdata : noop,
            text = settings.text ? settings.text : noop,
            start = settings.start ? settings.start : noop,
            end = settings.end ? settings.end : noop,
            pi = settings.pi ? settings.pi : noop,
            doctype = settings.doctype ? settings.doctype : noop,

            matches, index = 0, value, endRegExp, stack = [], attrList, i, textData, name, 
            isInternalElement, removeInternalElements, shortEndedElements, fillAttrsMap, isShortEnded,
            validate, elementRule, isValidElement, attr, attribsValue, validAttributesMap, validAttributePatterns,
            attributesRequired, attributesDefault, attributesForced, processHtml,
            anyAttributesRequired, selfClosing, tokenRegExp, attrRegExp, specialElements, attrValue, idCount = 0,
            fixSelfClosing, filteredUrlAttrs = Tools.makeMap("src,href,data,background,formaction,poster,xlink:href"),
            scriptUriRegExp = /((java|vb)script|mhtml):/i;

        // Precompile RegExps and map objects
        tokenRegExp = new RegExp('<(?:' +
            '(?:!--([\\w\\W]*?)-->)|' + // Comment
            '(?:!\\[CDATA\\[([\\w\\W]*?)\\]\\]>)|' + // CDATA
            '(?:!DOCTYPE([\\w\\W]*?)>)|' + // DOCTYPE
            '(?:\\?([^\\s\\/<>]+) ?([\\w\\W]*?)[?/]>)|' + // PI
            '(?:\\/([A-Za-z][A-Za-z0-9\\-_\\:\\.]*)>)|' + // End element
            '(?:([A-Za-z][A-Za-z0-9\\-_\\:\\.]*)((?:\\s+[^"\">]+(?:(?:"[^"]*")|(?:\"[^\"]*\")|[^>]*))*|\\/|\\s+)>)' + // Start element
            ')', 'g');
        attrRegExp = /([\w:\-]+)(?:\s*=\s*(?:(?:\"((?:[^\"])*)\")|(?:\"((?:[^\"])*)\")|([^>\s]+)))?/g;
        // Setup lookup tables for empty elements and boolean attributes
        shortEndedElements = schema.getShortEndedElements();
        selfClosing = settings.selfClosingElements || schema.getSelfClosingElements();
        fillAttrsMap = schema.getBoolAttrs();
        validate = settings.validate;
        removeInternalElements = settings.removeInternals;
        fixSelfClosing = settings.fixSelfClosing;
        specialElements = schema.getSpecialElements();
        processHtml = html + '>';

        while ((matches = tokenRegExp.exec(processHtml))) { // Adds and extra ">" to keep regexps from doing catastrofic backtracking on malformed html
            // Text
            if (index < matches.index) {
                text(Entities.decode(html.substr(index, matches.index - index)));
            }

            if ((value = matches[6])) { // End element
                value = value.toLowerCase();
                // IE will add a ":" in front of elements it doesn"t understand like custom elements or HTML5 elements
                if (value.charAt(0) === ":") {
                    value = value.substr(1);
                }
                this.__processEndTag(value, stack, end);
            }
            else if ((value = matches[7])) { // Start element
                // Did we consume the extra character then treat it as text
                // This handles the case with html like this: "text a<b text"
                if (matches.index + matches[0].length > html.length) {
                    text(Entities.decode(html.substr(matches.index)));
                    index = matches.index + matches[0].length;
                    continue;
                }

                value = value.toLowerCase();
                // IE will add a ":" in front of elements it doesn"t understand like custom elements or HTML5 elements
                if (value.charAt(0) === ':') {
                    value = value.substr(1);
                }

                isShortEnded = value in shortEndedElements;
                // Is self closing tag for example an <li> after an open <li>
                if (fixSelfClosing && selfClosing[value] && stack.length > 0 && stack[stack.length - 1].name === value) {
                    this.__processEndTag(value, stack, end);
                }

                // Always invalidate element if it"s marked as bogus
                let bogusValue = this.__checkBogusAttribute(attrRegExp, matches[8]);
                if (bogusValue !== null) {
                    if (bogusValue === "all") {
                        index = DOMUtils.findEndTagIndex(schema, html, tokenRegExp.lastIndex);
                        tokenRegExp.lastIndex = index;
                        continue;
                    }
                    isValidElement = false;
                }

                // Validate element
                if (!validate || (elementRule = schema.getElementRule(value))) {
                    isValidElement = true;

                    // Grab attributes map and patters when validation is enabled
                    if (validate) {
                        validAttributesMap = elementRule.attributes;
                        validAttributePatterns = elementRule.attributePatterns;
                    }

                    // Parse attributes
                    if ((attribsValue = matches[8])) {
                        // Check if the element is an internal element
                        isInternalElement = attribsValue.indexOf("data-editor-type") !== -1;

                        // If the element has internal attributes then remove it if we are told to do so
                        if (isInternalElement && removeInternalElements) {
                            isValidElement = false;
                        }

                        attrList = [];
                        attrList.map = {};
                        attribsValue.replace(attrRegExp, (match, name, value, val2, val3) => {
                            let attrRule, j, uri, trimRegExp = /[\s\u0000-\u001F]+/g;
                            name = name.toLowerCase();

                            // Handle boolean attribute than value attribute
                            value = name in fillAttrsMap ? name : Entities.decode(value || val2 || val3 || '');

                            // Validate name and value pass through all data- attributes
                            if (validate && !isInternalElement && this.__isValidPrefixAttrName(name) === false) {
                                attrRule = validAttributesMap[name];

                                // Find rule by pattern matching
                                if (!attrRule && validAttributePatterns) {
                                    j = validAttributePatterns.length;
                                    while (j--) {
                                        attrRule = validAttributePatterns[j];
                                        if (attrRule.pattern.test(name)) {
                                            break;
                                        }
                                    }

                                    // No rule matched
                                    if (j === -1) {
                                        attrRule = null;
                                    }
                                }

                                // No attribute rule found
                                if (!attrRule) {
                                    return;
                                }

                                // Validate value
                                if (attrRule.validValues && !(value in attrRule.validValues)) {
                                    return;
                                }
                            }

                            // Block any javascript: urls or non image data uris
                            if (filteredUrlAttrs[name] && !settings.allowScriptUrls) {
                                uri = value.replace(trimRegExp, '');
                                try {
                                    // Might throw malformed URI sequence
                                    uri = decodeURIComponent(uri);
                                }
                                catch (ex) {
                                    // Fallback to non UTF-8 decoder
                                    uri = unescape(uri);
                                }
                                if (scriptUriRegExp.test(uri)) {
                                    return;
                                }

                                if (this.__isInvalidUri(settings, uri)) {
                                    return;
                                }
                            }

                            // Block data or event attributes on elements marked as internal
                            if (isInternalElement && (name in filteredUrlAttrs || name.indexOf("on") === 0)) {
                                return;
                            }

                            // Add attribute to list and map
                            attrList.map[name] = value;
                            attrList.push({
                                name: name,
                                value: value
                            });
                        });
                    }
                    else {
                        attrList = [];
                        attrList.map = {};
                    }

                    // Process attributes if validation is enabled
                    if (validate && !isInternalElement) {
                        attributesRequired = elementRule.attributesRequired;
                        attributesDefault = elementRule.attributesDefault;
                        attributesForced = elementRule.attributesForced;
                        anyAttributesRequired = elementRule.removeEmptyAttrs;

                        // Check if any attribute exists
                        if (anyAttributesRequired && !attrList.length) {
                            isValidElement = false;
                        }

                        // Handle forced attributes
                        if (attributesForced) {
                            i = attributesForced.length;
                            while (i--) {
                                attr = attributesForced[i];
                                name = attr.name;
                                attrValue = attr.value;
                                if (attrValue === "{$uid}") {
                                    attrValue = "editor_" + idCount++;
                                }
                                attrList.map[name] = attrValue;
                                attrList.push({ name: name, value: attrValue });
                            }
                        }

                        // Handle default attributes
                        if (attributesDefault) {
                            i = attributesDefault.length;
                            while (i--) {
                                attr = attributesDefault[i];
                                name = attr.name;
                                if (!(name in attrList.map)) {
                                    attrValue = attr.value;
                                    if (attrValue === "{$uid}") {
                                        attrValue = "editor_" + idCount++;
                                    }
                                    attrList.map[name] = attrValue;
                                    attrList.push({ name: name, value: attrValue });
                                }
                            }
                        }

                        // Handle required attributes
                        if (attributesRequired) {
                            i = attributesRequired.length;
                            while (i--) {
                                if (attributesRequired[i] in attrList.map) {
                                    break;
                                }
                            }

                            // None of the required attributes where found
                            if (i === -1) {
                                isValidElement = false;
                            }
                        }

                        // Invalidate element if it"s marked as bogus
                        if ((attr = attrList.map["data-editor-bogus"])) {
                            if (attr === "all") {
                                index = DOMUtils.findEndTagIndex(schema, html, tokenRegExp.lastIndex);
                                tokenRegExp.lastIndex = index;
                                continue;
                            }
                            isValidElement = false;
                        }
                    }

                    if (isValidElement) {
                        start(value, attrList, isShortEnded);
                    }
                }
                else {
                    isValidElement = false;
                }

                // Treat script, noscript and style a bit different since they may include code that looks like elements
                if ((endRegExp = specialElements[value])) {
                    endRegExp.lastIndex = index = matches.index + matches[0].length;
                    if ((matches = endRegExp.exec(html))) {
                        if (isValidElement) {
                            textData = html.substr(index, matches.index - index);
                        }
                        index = matches.index + matches[0].length;
                    }
                    else {
                        textData = html.substr(index);
                        index = html.length;
                    }

                    if (isValidElement) {
                        if (textData.length > 0) {
                            text(textData, true);
                        }
                        end(value);
                    }

                    tokenRegExp.lastIndex = index;
                    continue;
                }

                // Push value on to stack
                if (!isShortEnded) {
                    if (!attribsValue || attribsValue.indexOf('/') !== attribsValue.length - 1) {
                        stack.push({ name: value, valid: isValidElement });
                    }
                    else if (isValidElement) {
                        end(value);
                    }
                }
            }
            else if ((value = matches[1])) { // Comment
                // Padd comment value to avoid browsers from parsing invalid comments as HTML
                if (value.charAt(0) === '>') {
                    value = ' ' + value;
                }
                if (!settings.allowConditionalComments && value.substr(0, 3).toLowerCase() === "[if") {
                    value = " " + value;
                }
                comment(value);
            }
            else if ((value = matches[2])) { // CDATA
                cdata(value.replace(/<!--|-->/g, ''));
            }
            else if ((value = matches[3])) { // DOCTYPE
                doctype(value);
            }
            else if ((value = matches[4])) { // PI
                pi(value, matches[5]);
            }
            index = matches.index + matches[0].length;
        }

        // Text
        if (index < html.length) {
            text(Entities.decode(html.substr(index)));
        }

        // Close any open elements
        for (i = stack.length - 1; i >= 0; i--) {
            value = stack[i];
            if (value.valid) {
                end(value.name);
            }
        }
    }

    static findEndTagIndex(schema, html, startIndex) {
        let count = 1, index, matches, tokenRegExp, shortEndedElements;

        shortEndedElements = schema.getShortEndedElements();
        tokenRegExp = /<([!?\/])?([A-Za-z0-9\-_\:\.]+)((?:\s+[^"\'>]+(?:(?:"[^"]*")|(?:\'[^\']*\')|[^>]*))*|\/|\s+)>/g;
        tokenRegExp.lastIndex = index = startIndex;

        while ((matches = tokenRegExp.exec(html))) {
            index = tokenRegExp.lastIndex;
            
            if (matches[1] === '/') { // End element
                count--;
            }
            else if (!matches[1]) { // Start element
                if (matches[2] in shortEndedElements) {
                    continue;
                }
                count++;
            }

            if (count === 0) {
                break;
            }
        }

        return index;
    }

    __processEndTag(name, stack, end) {
        let pos, i, pos = stack.length;
        while (pos--) {
            if (stack[pos].name === name) {
                break;
            }
        }

        // Found parent
        if (pos >= 0) {
            // Close all the open elements
            for (i = stack.length - 1; i >= pos; i--) {
                name = stack[i];
                if (name.valid) {
                    end(name.name);
                }
            }
            // Remove the open elements from the stack
            stack.length = pos;
        }
    }

    __checkBogusAttribute(regExp, attrString) {
        let matches = regExp.exec(attrString), name, value;
        if (matches) {
            name = matches[1];
            value = matches[2];
            return typeof name === "string" && name.toLowerCase() === "data-editor-bogus" ? value : null;
        }
        else {
            return null;
        }
    }

    __isValidPrefixAttrName(name) {
        return name.indexOf("data-") === 0 || name.indexOf("aria-") === 0;
    }

    __isInvalidUri(settings, uri) {
        if (settings.allowHtmlDataUrls) {
            return false;
        }
        else if (/^data:image\//i.test(uri)) {
            return settings.allowSvgDataUrls === false && /^data:image\/svg\+xml/i.test(uri);
        }
        else {
            return /^data:/i.test(uri);
        }
    }
}