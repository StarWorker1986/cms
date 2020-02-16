import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";

export default class Schema {
    constructor(settings) {
        this._validStyles = null;
        this._invalidStyles = null;
        this._validClasses = null;
        this._boolAttrMap = null;
        this._blockElementsMap = null;
        this._textBlockElementsMap = null;
        this._textInlineElementsMap = null;
        this._shortEndedElementsMap = null;
        this._selfClosingElementsMap = null;
        this._nonEmptyElementsMap = null;
        this._moveCaretBeforeOnEnterElementsMap = null;
        this._whiteSpaceElementsMap = null;
        this._specialElements = {};
        this._children = {};
        this._elements = {};
        this._patternElements = [];
        this._schemaItems = null;
        this._customElementsMap = {};
        this.init(settings);
    }

    init(settings) {
        let elements = this._elements, createLookupTable = this.__createLookupTable, each = Tools.each,
            addValidElements = (validElements) => this.addValidElements(validElements),
            setValidElements = (validElements) => this.setValidElements(validElements),
            addCustomElements = (customElements) => this.addCustomElements(customElements),
            addValidChildren = (validChildren) => this.addValidChildren(validChildren, settings.schema),
            getElementRule = (name) => this.__getElementRule(name);

        settings = settings || {};
        this._schemaItems = this.__compileSchema(settings.schema);

        // Allow all elements and attributes if verifyHtml is set to false
        if (settings.verifyHtml === false) {
            settings.validElements = "*[*]";
        }

        this._validStyles = this.__compileElementMap(settings.validStyles);
        this._invalidStyles = this.__compileElementMap(settings.invalidStyles, "map");
        this._validClasses = this.__compileElementMap(settings.validClasses, "map");
        
        // Setup map objects
        this._whiteSpaceElementsMap = createLookupTable("whitespaceElements", "pre script noscript style textarea video audio iframe object code");
        this._selfClosingElementsMap = createLookupTable("selfClosingElements", "colgroup dd dt li option p td tfoot th thead tr");
        this._shortEndedElementsMap = createLookupTable("shortEndedElements", "area base basefont br col frame hr img input isindex link meta param embed source wbr track");
        this._boolAttrMap = createLookupTable("booleanAttributes", "checked compact declare defer disabled ismap multiple nohref noresize noshade nowrap readonly selected autoplay loop controls");
        this._nonEmptyElementsMap = createLookupTable("nonEmptyElements", "td th iframe video audio object script pre code", this._shortEndedElementsMap);
        this._moveCaretBeforeOnEnterElementsMap = createLookupTable("moveCaretBeforeOnEnterElements", "table", this._nonEmptyElementsMap);
        this._textBlockElementsMap = createLookupTable("textBlockElements", "h1 h2 h3 h4 h5 h6 p div address pre form blockquote center dir fieldset header footer article section hgroup aside main nav figure");
        this._blockElementsMap = createLookupTable("blockElements", "hr table tbody thead tfoot th tr td li ol ul caption dl dt dd noscript menu isindex option datalist select optgroup figcaption details summary", this._textBlockElementsMap);
        this._textInlineElementsMap = createLookupTable("textInlineElements", "span strong b em i font strike u var cite dfn code mark q sup sub samp");
        Tools.each((settings.special || "script noscript noframes noembed title style textarea xmp").split(' '), (name) => {
            this._specialElements[name] = new RegExp("<\/" + name + "[^>]*>", "gi");
        });

        if (!settings.validElements) {
            // No valid elements defined then clone the elements from the schema spec
            each(this._schemaItems, (element, name) => {
                elements[name] = {
                    attributes: element.attributes,
                    attributesOrder: element.attributesOrder
                };
                this._children[name] = element.children;
            });

            // Switch these on HTML4
            if (settings.schema !== "html5") {
                each(split("strong/b em/i"), (item) => {
                    item = split(item, "/");
                    elements[item[1]].outputName = item[0];
                });
            }

            // Add default alt attribute for images, removed since alt='' is treated as presentational.
            // elements.img.attributesDefault = [{name: "alt", value: ''}];
            // Remove these if they are empty by default
            each(split("ol ul sub sup blockquote span font a table tbody tr strong em b i"), (name) => {
                if (elements[name]) {
                    elements[name].removeEmpty = true;
                }
            });

            // Padd these by default
            each(split("p h1 h2 h3 h4 h5 h6 th td pre div address caption li"), (name) => {
                elements[name].paddEmpty = true;
            });

            // Remove these if they have no attributes
            each(split("span"), (name) => {
                elements[name].removeEmptyAttrs = true;
            });
        }
        else {
            setValidElements(settings.validElements);
        }

        addCustomElements(settings.customElements);
        addValidChildren(settings.validChildren);
        addValidElements(settings.extendedValidElements);
        // Todo: Remove this when we fix list handling to be valid
        addValidChildren("+ol[ul|ol],+ul[ul|ol]");
        // Some elements are not valid by themselves - require parents
        each({
            dd: "dl",
            dt: "dl",
            li: "ul ol",
            td: "tr",
            th: "tr",
            tr: "tbody thead tfoot",
            tbody: "table",
            thead: "table",
            tfoot: "table",
            legend: "fieldset",
            area: "map",
            param: "video audio object"
        }, (parents, item) => {
            if (elements[item]) {
                elements[item].parentsRequired = split(parents);
            }
        });

        // Delete invalid elements
        if (settings.invalidElements) {
            each(ArrUtils.explode(settings.invalidElements), (item) => {
                if (elements[item]) {
                    delete elements[item];
                }
            });
        }

        // If the user didn"t allow span only allow internal spans
        if (!getElementRule("span")) {
            addValidElements("span[!data-editor-type|*]");
        }
    }

    getChildren() { return this._children; }
    getElements() { return this._elements; }
    getValidStyles() { return this._validStyles; }
    getInvalidStyles() { return this._invalidStyles; }
    getValidClasses() { return this._validClasses; }
    getBoolAttrs() { return this._boolAttrMap; }
    getBlockElements() { return this._blockElementsMap; }
    getTextBlockElements() { return this._textBlockElementsMap; }
    getTextInlineElements() { return this._textInlineElementsMap; }
    getShortEndedElements() { return this._shortEndedElementsMap; }
    getSelfClosingElements() { return this._selfClosingElementsMap; }
    getNonEmptyElements() { return this._nonEmptyElementsMap; }
    getMoveCaretBeforeOnEnterElements() { return this._moveCaretBeforeOnEnterElementsMap; }
    getWhiteSpaceElements() { return this._whiteSpaceElementsMap; }
    getSpecialElements() { return this._specialElements; }
    getCustomElements() { return this._customElementsMap; }
    
    addCustomElements(customElements) {
        let customElementRegExp = /^(~)?(.+)$/, elements = this._elements,
            customElementsMap = this._customElementsMap, blockElementsMap = this._blockElementsMap,
            children = this._children;

        if (customElements) {
            // Flush cached items since we are altering the default maps
            Schema.mapCache.textBlockElements = Schema.mapCache.blockElements = null;
            Tools.each(this.__split(customElements, ','), (rule) => {
                let matches = customElementRegExp.exec(rule), inline = matches[1] === '~',
                    name = matches[2], cloneName = inline ? "span" : "div";

                children[name] = children[cloneName];
                customElementsMap[name] = cloneName;

                // If it"s not marked as inline then add it to valid block elements
                if (!inline) {
                    blockElementsMap[name.toUpperCase()] = {};
                    blockElementsMap[name] = {};
                }

                // Add elements clone if needed
                if (!elements[name]) {
                    let customRule = elements[cloneName];
                    customRule = Tools.extend({}, customRule);
                    delete customRule.removeEmptyAttrs;
                    delete customRule.removeEmpty;
                    elements[name] = customRule;
                }

                // Add custom elements at span/div positions
                Tools.each(children, (element, elmName) => {
                    if (element[cloneName]) {
                        children[elmName] = element = Tools.extend({}, children[elmName]);
                        element[name] = element[cloneName];
                    }
                });
            });
        }
    }

    addValidChildren(validChildren, schema) {
        let childRuleRegExp = /^([+\-]?)(\w+)\[([^\]]+)\]$/, children = this._children;

        // Invalidate the schema cache if the schema is mutated
        Schema.mapCache[schema] = null;

        if (validChildren) {
            Tools.each(this.__split(validChildren, ','), (rule) => {
                let matches = childRuleRegExp.exec(rule), parent, prefix;
                
                if (matches) {
                    prefix = matches[1];
                    // Add/remove items from default
                    if (prefix) {
                        parent = children[matches[2]];
                    }
                    else {
                        parent = children[matches[2]] = { "#comment": {} };
                    }

                    parent = children[matches[2]];
                    Tools.each(this.__split(matches[3], '|'), (child) => {
                        if (prefix === '-') {
                            delete parent[child];
                        }
                        else {
                            parent[child] = {};
                        }
                    });
                }
            });
        }
    }

    addValidElements(validElements) {
        let ei, el, ai, al, matches, element, attr, attrData, elementName, attrName,
            attrType, attributes, attributesOrder, prefix, outputName, globalAttributes, globalAttributesOrder, key, value,
            elements = this._elements, patternElements = this._patternElements, split = this.__split;
            elementRuleRegExp = /^([#+\-])?([^\[!\/]+)(?:\/([^\[!]+))?(?:(!?)\[([^\]]+)\])?$/,
            attrRuleRegExp = /^([!\-])?(\w+[\\:]:\w+|[^=:<]+)?(?:([=:<])(.*))?$/,
            hasPatternsRegExp = /[*?+]/,
            patternToRegExp = (str) => new RegExp('^' + str.replace(/([?+*])/g, ".$1") + '$');

        if (validElements) {
            // Split valid elements into an array with rules
            validElements = split(validElements, ",");
            if (elements['@']) {
                globalAttributes = elements['@'].attributes;
                globalAttributesOrder = elements['@'].attributesOrder;
            }

            // Loop all rules
            for (ei = 0, el = validElements.length; ei < el; ei++) {
                // Parse element rule
                matches = elementRuleRegExp.exec(validElements[ei]);
                if (matches) {
                    // Setup local names for matches
                    prefix = matches[1];
                    elementName = matches[2];
                    outputName = matches[3];
                    attrData = matches[5];

                    // Create new attributes and attributesOrder
                    attributes = {};
                    attributesOrder = [];

                    // Create the new element
                    element = {
                        attributes: attributes,
                        attributesOrder: attributesOrder
                    };

                    // Padd empty elements prefix
                    if (prefix === '#') {
                        element.paddEmpty = true;
                    }

                    // Remove empty elements prefix
                    if (prefix === '-') {
                        element.removeEmpty = true;
                    }

                    if (matches[4] === '!') {
                        element.removeEmptyAttrs = true;
                    }

                    // Copy attributes from global rule into current rule
                    if (globalAttributes) {
                        for (key in globalAttributes) {
                            attributes[key] = globalAttributes[key];
                        }
                        attributesOrder.push.apply(attributesOrder, globalAttributesOrder);
                    }

                    // Attributes defined
                    if (attrData) {
                        attrData = split(attrData, "|");
                        for (ai = 0, al = attrData.length; ai < al; ai++) {
                            matches = attrRuleRegExp.exec(attrData[ai]);
                            if (matches) {
                                attr = {};
                                attrType = matches[1];
                                attrName = matches[2].replace(/[\\:]:/g, ":");
                                prefix = matches[3];
                                value = matches[4];

                                // Required
                                if (attrType === '!') {
                                    element.attributesRequired = element.attributesRequired || [];
                                    element.attributesRequired.push(attrName);
                                    attr.required = true;
                                }

                                // Denied from global
                                if (attrType === "-") {
                                    delete attributes[attrName];
                                    attributesOrder.splice(inArray(attributesOrder, attrName), 1);
                                    continue;
                                }

                                // Default value
                                if (prefix) {
                                    // Default value
                                    if (prefix === '=') {
                                        element.attributesDefault = element.attributesDefault || [];
                                        element.attributesDefault.push({ name: attrName, value: value });
                                        attr.defaultValue = value;
                                    }

                                    // Forced value
                                    if (prefix === ':') {
                                        element.attributesForced = element.attributesForced || [];
                                        element.attributesForced.push({ name: attrName, value: value });
                                        attr.forcedValue = value;
                                    }

                                    // Required values
                                    if (prefix === '<') {
                                        attr.validValues = makeMap(value, "?");
                                    }
                                }

                                // Check for attribute patterns
                                if (hasPatternsRegExp.test(attrName)) {
                                    element.attributePatterns = element.attributePatterns || [];
                                    attr.pattern = patternToRegExp(attrName);
                                    element.attributePatterns.push(attr);
                                }
                                else {
                                    // Add attribute to order list if it doesn"t already exist
                                    if (!attributes[attrName]) {
                                        attributesOrder.push(attrName);
                                    }
                                    attributes[attrName] = attr;
                                }
                            }
                        }
                    }

                    // Global rule, store away these for later usage
                    if (!globalAttributes && elementName === '@') {
                        globalAttributes = attributes;
                        globalAttributesOrder = attributesOrder;
                    }

                    // Handle substitute elements such as b/strong
                    if (outputName) {
                        element.outputName = elementName;
                        elements[outputName] = element;
                    }

                    // Add pattern or exact element
                    if (hasPatternsRegExp.test(elementName)) {
                        element.pattern = patternToRegExp(elementName);
                        patternElements.push(element);
                    }
                    else {
                        elements[elementName] = element;
                    }
                }
            }
        }
    }

    isValidChild(name, child) {
        let parent = this._children[name.toLowerCase()];
        return !!(parent && parent[child.toLowerCase()]);
    }

    isValid(name, attr) {
        let attrPatterns, i, rule = this.__getElementRule(name);

        // Check if it"s a valid element
        if (rule) {
            if (attr) {
                // Check if attribute name exists
                if (rule.attributes[attr]) {
                    return true;
                }
                // Check if attribute matches a regexp pattern
                attrPatterns = rule.attributePatterns;
                if (attrPatterns) {
                    i = attrPatterns.length;
                    while (i--) {
                        if (attrPatterns[i].pattern.test(name)) {
                            return true;
                        }
                    }
                }
            }
            else {
                return true;
            }
        }
        // No match
        return false;
    }

    setValidElements(validElements) {
        this._elements = {};
        this._patternElements = [];
        this.addValidElements(validElements);
        Tools.each(this._schemaItems, (element, name) => {
            this._children[name] = element.children;
        });
    }

    __arrayToMap(array, obj) {
        let map = {};
        for (let i = 0, l = array.length; i < l; i++) {
            map[array[i]] = obj || {};
        }
        return map;
    }

    __add(schema, name, globalAttributes, attributes) {
        let ni, attributesOrder, element, children, split = this.__split;

        children = this._children || [];
        attributes = attributes || '';

        if (typeof children === "string") {
            children = split(children);
        }

        name = split(name);
        ni = name.length;

        while (ni--) {
            attributesOrder = split([globalAttributes, attributes].join(' '));
            element = {
                attributes: this.__arrayToMap(attributesOrder),
                attributesOrder: attributesOrder,
                children: this.__arrayToMap(children, dummyObj)
            };
            schema[name[ni]] = element;
        }
    }

    __addAttrs(schema, name, attributes) {
        let ni = name.length, schemaItem;

        name = this.__split(name);
        attributes = this.__split(attributes);

        while (ni--) {
            schemaItem = schema[name[ni]];
            for (let i = 0, l = attributes.length; i < l; i++) {
                schemaItem.attributes[attributes[i]] = {};
                schemaItem.attributesOrder.push(attributes[i]);
            }
        }
    }

    __createLookupTable(option, value, defaultValue, extendWith) {
        if (!value) {
            // Get cached default map or make it if needed
            value = Schema.mapCache[option];
            if (!value) {
                value = Tools.makeMap(defaultValue, ' ', Tools.makeMap(defaultValue.toUpperCase(), ' '));
                value = Tools.extend(value, extendWith);
                Schema.mapCache[option] = value;
            }
        }
        else {
            // Create custom map
            value = Tools.makeMap(value, /[, ]/, Tools.makeMap(value.toUpperCase(), /[, ]/));
        }

        return value;
    }

    __compileElementMap(value, mode) {
        let styles;
        if (value) {
            styles = {};
            if (typeof value === "string") {
                value = {
                    '*': value
                };
            }
            // Convert styles into a rule list
            Tools.each(value, (value, key) => {
                styles[key] = styles[key.toUpperCase()] = (mode === "map" ? Tools.makeMap(value, /[, ]/) : ArrUtils.explode(value, /[, ]/));
            });
        }
        return styles;
    }

    __compileSchema(type) {
        let schema = {}, globalAttributes, blockContent, phrasingContent, flowContent,
            html4BlockContent, html4PhrasingContent, split = this.__split;
            add = (name, attributes, children) => this.__add(schema, name, globalAttributes, attributes, children),
            addAttrs = (name, attributes) => this.__addAttrs(schema, name, attributes);

        // Use cached schema
        if (Schema.mapCache[type]) {
            return Schema.mapCache[type];
        }

        // Attributes present on all elements
        globalAttributes = "id accesskey class dir lang style tabindex title role";

        // Block content elements
        blockContent = "address blockquote div dl fieldset form h1 h2 h3 h4 h5 h6 hr menu ol p pre table ul";

        // Phrasing content elements from the HTML5 spec (inline)
        phrasingContent = "a abbr b bdo br button cite code del dfn em embed i iframe img input ins kbd label map noscript object q s samp script select small span strong sub sup textarea u var #text #comment";
        
        // Add HTML5 items to globalAttributes, blockContent, phrasingContent
        if (type !== "html4") {
            globalAttributes += " contenteditable contextmenu draggable dropzone hidden spellcheck translate";
            blockContent += " article aside details dialog figure main header footer hgroup section nav";
            phrasingContent += " audio canvas command datalist mark meter output picture progress time wbr video ruby bdi keygen";
        }

        // Add HTML4 elements unless it"s html5-strict
        if (type !== "html5Strict") {
            globalAttributes += " xml:lang";
            html4PhrasingContent = "acronym applet basefont big font strike tt";
            phrasingContent = [phrasingContent, html4PhrasingContent].join(' ');
            Tools.each(split(html4PhrasingContent), (name) => {
                add(name, '', phrasingContent);
            });

            html4BlockContent = "center dir isindex noframes";
            blockContent = [blockContent, html4BlockContent].join(' ');
            // Flow content elements from the HTML5 spec (block+inline)
            flowContent = [blockContent, phrasingContent].join(' ');
            Tools.each(split(html4BlockContent), (name) => {
                add(name, '', flowContent);
            });
        }

        // Flow content elements from the HTML5 spec (block+inline)
        flowContent = flowContent || [blockContent, phrasingContent].join(' ');
        
        // HTML4 base schema TODO: Move HTML5 specific attributes to HTML5 specific if statement
        // Schema items <element name>, <specific attributes>, <children ..>
        add("html", "manifest", "head body");
        add("head", '', "base command link meta noscript script style title");
        add("title hr noscript br");
        add("base", "href target");
        add("link", "href rel media hreflang type sizes hreflang");
        add("meta", "name http-equiv content charset");
        add("style", "media type scoped");
        add("script", "src async defer type charset");
        add("body", "onafterprint onbeforeprint onbeforeunload onblur onerror onfocus onhashchange onload onmessage onoffline ononline onpagehide onpageshow onpopstate onresize onscroll onstorage onunload", flowContent);
        add("address dt dd div caption", '', flowContent);
        add("h1 h2 h3 h4 h5 h6 pre p abbr code var samp kbd sub sup i b u bdo span legend em strong small s cite dfn", '', phrasingContent);
        add("blockquote", "cite", flowContent);
        add("ol", "reversed start type", "li");
        add("ul", '', "li");
        add("li", "value", flowContent);
        add("dl", '', "dt dd");
        add("a", "href target rel media hreflang type", phrasingContent);
        add("q", "cite", phrasingContent);
        add("ins del", "cite datetime", flowContent);
        add("img", "src sizes srcset alt usemap ismap width height");
        add("iframe", "src name width height", flowContent);
        add("embed", "src type width height");
        add("object", "data type typemustmatch name usemap form width height", [flowContent, "param"].join(' '));
        add("param", "name value");
        add("map", "name", [flowContent, "area"].join(' '));
        add("area", "alt coords shape href target rel media hreflang type");
        add("table", "border", "caption colgroup thead tfoot tbody tr" + (type === "html4" ? " col" : ''));
        add("colgroup", "span", "col");
        add("col", "span");
        add("tbody thead tfoot", '', "tr");
        add("tr", '', "td th");
        add("td", "colspan rowspan headers", flowContent);
        add("th", "colspan rowspan headers scope abbr", flowContent);
        add("form", "accept-charset action autocomplete enctype method name novalidate target", flowContent);
        add("fieldset", "disabled form name", [flowContent, "legend"].join(' '));
        add("label", "form for", phrasingContent);
        add("input", "accept alt autocomplete checked dirname disabled form formaction formenctype formmethod formnovalidate formtarget height list max maxlength min multiple name pattern readonly required size src step type value width");
        add("button", "disabled form formaction formenctype formmethod formnovalidate formtarget name type value", type === "html4" ? flowContent : phrasingContent);
        add("select", "disabled form multiple name required size", "option optgroup");
        add("optgroup", "disabled label", "option");
        add("option", "disabled label selected value");
        add("textarea", "cols dirname disabled form maxlength name readonly required rows wrap");
        add("menu", "type label", [flowContent, "li"].join(' '));
        add("noscript", '', flowContent);

        // Extend with HTML5 elements
        if (type !== "html4") {
            add("wbr");
            add("ruby", '', [phrasingContent, "rt rp"].join(' '));
            add("figcaption", '', flowContent);
            add("mark rt rp summary bdi", '', phrasingContent);
            add("canvas", "width height", flowContent);
            add("video", "src crossorigin poster preload autoplay mediagroup loop muted controls width height buffered", [flowContent, "track source"].join(' '));
            add("audio", "src crossorigin preload autoplay mediagroup loop muted controls buffered volume", [flowContent, "track source"].join(' '));
            add("picture", '', "img source");
            add("source", "src srcset type media sizes");
            add("track", "kind src srclang label default");
            add("datalist", '', [phrasingContent, "option"].join(' '));
            add("article section nav aside main header footer", '', flowContent);
            add("hgroup", '', "h1 h2 h3 h4 h5 h6");
            add("figure", '', [flowContent, "figcaption"].join(' '));
            add("time", "datetime", phrasingContent);
            add("dialog", "open", flowContent);
            add("command", "type label icon disabled checked radiogroup command");
            add("output", "for form name", phrasingContent);
            add("progress", "value max", phrasingContent);
            add("meter", "value min max low high optimum", phrasingContent);
            add("details", "open", [flowContent, "summary"].join(' '));
            add("keygen", "autofocus challenge disabled form keytype name");
        }

        // Extend with HTML4 attributes unless it"s html5-strict
        if (type !== "html5-strict") {
            addAttrs("script", "language xml:space");
            addAttrs("style", "xml:space");
            addAttrs("object", "declare classid code codebase codetype archive standby align border hspace vspace");
            addAttrs("embed", "align name hspace vspace");
            addAttrs("param", "valuetype type");
            addAttrs("a", "charset name rev shape coords");
            addAttrs("br", "clear");
            addAttrs("applet", "codebase archive code object alt name width height align hspace vspace");
            addAttrs("img", "name longdesc align border hspace vspace");
            addAttrs("iframe", "longdesc frameborder marginwidth marginheight scrolling align");
            addAttrs("font basefont", "size color face");
            addAttrs("input", "usemap align");
            addAttrs("select", "onchange");
            addAttrs("textarea");
            addAttrs("h1 h2 h3 h4 h5 h6 div p legend caption", "align");
            addAttrs("ul", "type compact");
            addAttrs("li", "type");
            addAttrs("ol dl menu dir", "compact");
            addAttrs("pre", "width xml:space");
            addAttrs("hr", "align noshade size width");
            addAttrs("isindex", "prompt");
            addAttrs("table", "summary width frame rules cellspacing cellpadding align bgcolor");
            addAttrs("col", "width align char charoff valign");
            addAttrs("colgroup", "width align char charoff valign");
            addAttrs("thead", "align char charoff valign");
            addAttrs("tr", "align char charoff valign bgcolor");
            addAttrs("th", "axis align char charoff valign nowrap bgcolor width height");
            addAttrs("form", "accept");
            addAttrs("td", "abbr axis scope align char charoff valign nowrap bgcolor width height");
            addAttrs("tfoot", "align char charoff valign");
            addAttrs("tbody", "align char charoff valign");
            addAttrs("area", "nohref");
            addAttrs("body", "background bgcolor text link vlink alink");
        }
        // Extend with HTML5 attributes unless it"s html4
        if (type !== "html4") {
            addAttrs("input button select textarea", "autofocus");
            addAttrs("input textarea", "placeholder");
            addAttrs("a", "download");
            addAttrs("link script img", "crossorigin");
            addAttrs("iframe", "sandbox seamless allowfullscreen"); // Excluded: srcdoc
        }
        
        // Special: iframe, ruby, video, audio, label
        // Delete children of the same name from it"s parent
        // For example: form can"t have a child of the name form
        Tools.each(split("a form meter progress dfn"), (name) => {
            if (schema[name]) {
                delete schema[name].children[name];
            }
        })

        // Caption can"t have tables
        delete schema.caption.children.table;
        // Delete scripts by default due to possible XSS
        delete schema.script;
        // TODO: LI:s can only have value if parent is OL
        // TODO: Handle transparent elements a ins del canvas map
        Schema.mapCache[type] = schema;

        return schema;
    }

    __getElementRule(name) {
        let element = this._elements[name], i;

        // Exact match found
        if (element) {
            return element;
        }

        // No exact match then try the patterns
        i = this._patternElements.length;
        while (i--) {
            element = this._patternElements[i];
            if (element.pattern.test(name)) {
                return element;
            }
        }
    }

    __split(items, delim) {
        items = Tools.trim(items);
        return items ? items.split(delim || ' ') : [];
    }
}

Schema.mapCache = Schema.mapCache || {};