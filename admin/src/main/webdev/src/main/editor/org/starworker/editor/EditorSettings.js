import PlatformDetection from "../util/PlatformDetection";
import Tools from "../util/Option";
import Tools from "../util/Tools";
import Objects from "../util/Objects";

export default class EditorSettings {
    static combineSettings(isTouchDevice, defaultSettings, defaultOverrideSettings, settings) {
        let sectionResult = this.__extractSections(["mobile"], settings),
            isPhone = PlatformDetection.detect().deviceType.isPhone(),
            extendedSettings = Tools.extend(
                defaultSettings, 
                defaultOverrideSettings, 
                sectionResult.settings(),
                this.__isOnMobile(isTouchDevice, sectionResult) ? this.__getSection(sectionResult, "mobile", isPhone ? { theme: "mobile" } : {}) : {},
                {
                    validate: true,
                    externalPlugins: this.__getExternalPlugins(defaultOverrideSettings, sectionResult.settings())
                }
            );

        return this.__processPlugins(isTouchDevice, sectionResult, defaultOverrideSettings, extendedSettings);
    }

    static get(editor, name) {
        return Option.from(editor.settings[name]);
    }

    static getEditorSettings(editor, id, documentBaseUrl, defaultOverrideSettings, settings) {
        let defaultSettings = this.__getDefaultSettings(id, documentBaseUrl, editor),
            isTouch = PlatformDetection.detect().deviceType.isTouch();
        return this.combineSettings(isTouch, defaultSettings, defaultOverrideSettings, settings);
    }

    static getParam(editor, name, defaultVal, type) {
        let value = name in editor.settings ? editor.settings[name] : defaultVal;
        if (type === "hash") {
            return this.__getParamObject(value);
        }
        else if (type === "string") {
            return this.__getFiltered(Tools.isString, editor, name).getOr(defaultVal);
        }
        else if (type === "number") {
            return this.__getFiltered(Tools.isNumber, editor, name).getOr(defaultVal);
        }
        else if (type === "boolean") {
            return this.__getFiltered(Tools.isBoolean, editor, name).getOr(defaultVal);
        }
        else if (type === "object") {
            return this.__getFiltered(Tools.isObject, editor, name).getOr(defaultVal);
        }
        else if (type === "array") {
            return this.__getFiltered(Tools.isArray, editor, name).getOr(defaultVal);
        }
        else if (type === "string[]") {
            return this.__getFiltered(this.__isArrayOf(Tools.isString), editor, name).getOr(defaultVal);
        }
        else if (type === "function") {
            return this.__getFiltered(Tools.isFunction, editor, name).getOr(defaultVal);
        }
        else {
            return value;
        }
    }

    static getString(editor, name) {
        return this.__getFiltered(Tools.isString, editor, name);
    }

    static __combinePlugins(forcedPlugins, plugins) {
        return [].concat(this.__normalizePlugins(forcedPlugins)).concat(this.__normalizePlugins(plugins));
    }

    static __extractSections(keys, settings) {
        let sectionResult = Tools.immutable("sections", "settings"),
            result = Objects.bifilter(settings, (v, k) => Tools.contains(keys, k));
        return sectionResult(result.t, result.f);
    }

    static __filterMobilePlugins(plugins) {
        return Tools.filter(plugins, (v) => Tools.contains(["lists", "autolink", "autosave"], v));
    }

    static __getDefaultSettings(id, documentBaseUrl, editor) {
        return {
            id: id,
            theme: "silver",
            popupCss: '',
            plugins: '',
            documentBaseUrl: documentBaseUrl,
            addFormSubmitTrigger: true,
            submitPatch: true,
            addUnloadTrigger: true,
            convertUrls: true,
            relativeUrls: true,
            removeScriptHost: true,
            objectResizing: true,
            doctype: "<!DOCTYPE html>",
            visual: true,
            fontSizeStyleValues: "xx-small,x-small,small,medium,large,x-large,xx-large",
            fontSizeLegacyValues: "xx-small,small,medium,large,x-large,xx-large,300%",
            forcedRootBlock: 'p',
            hiddenInput: true,
            renderUi: true,
            inlineStyles: true,
            convertFontsToSpans: true,
            indent: "simple",
            indentBefore: "p,h1,h2,h3,h4,h5,h6,blockquote,div,title,style,pre,script,td,th,ul,ol,li,dl,dt,dd,area,table,thead," +
                          "tfoot,tbody,tr,section,summary,article,hgroup,aside,figure,figcaption,option,optgroup,datalist",
            indentAfter: "p,h1,h2,h3,h4,h5,h6,blockquote,div,title,style,pre,script,td,th,ul,ol,li,dl,dt,dd,area,table,thead," +
                          "tfoot,tbody,tr,section,summary,article,hgroup,aside,figure,figcaption,option,optgroup,datalist",
            entityEncoding: "named",
            urlConverter: editor.convertURL,
            urlConverterScope: editor,
            ie7Compat: true
        };
    }

    static __getExternalPlugins(overrideSettings, settings) {
        let userDefinedExternalPlugins = settings.externalPlugins ? settings.externalPlugins : {};
        if (overrideSettings && overrideSettings.externalPlugins) {
            return Tools.extend({}, overrideSettings.externalPlugins, userDefinedExternalPlugins);
        }
        else {
            return userDefinedExternalPlugins;
        }
    }

    static __getFiltered(predicate, editor, name) {
        return Option.from(editor.settings[name]).filter(predicate);
    }

    static __getParamObject(value) {
        let output = {};
        if (typeof value === "string") {
            let arry = value.indexOf('=') > 0 ? value.split(/[;,](?![^=;,]*(?:[;,]|$))/) : value.split(',');
            Tools.each(arry, (val) => {
                let arr = val.split('=');
                if (arr.length > 1) {
                    output[Tools.trim(arr[0])] = Tools.trim(arr[1]);
                }
                else {
                    output[Tools.trim(arr[0])] = Tools.trim(arr);
                }
            });
        }
        else {
            output = value;
        }
        return output;
    }

    static __getSection(sectionResult, name, defaults) {
        let sections = sectionResult.sections(),
            sectionSettings = sections.hasOwnProperty(name) ? sections[name] : {};
        return Tools.extend({}, defaults, sectionSettings);
    }

    static __isArrayOf(p) {
        return (a) => Tools.isArray(a) && Tools.forall(a, p); 
    }

    static __isOnMobile(isTouchDevice, sectionResult) {
        let isInline = sectionResult.settings().inline;
        return isTouchDevice && !isInline;
    }

    static __normalizePlugins(plugins) {
        let pluginNames = Tools.isArray(plugins) ? plugins.join(' ') : plugins,
            trimmedPlugins = Tools.map(Tools.isString(pluginNames) ? pluginNames.split(' ') : [], Tools.trim);
        return Tools.filter(trimmedPlugins, (item) => item.length > 0);
    }

    static __hasSection(sectionResult, name) {
        return sectionResult.sections().hasOwnProperty(name);
    }

    static __processPlugins(isTouchDevice, sectionResult, defaultOverrideSettings, settings) {
        let forcedPlugins = this.__normalizePlugins(defaultOverrideSettings.forcedPlugins),
            plugins = this.__normalizePlugins(settings.plugins),
            platformPlugins = isTouchDevice && this.__hasSection(sectionResult, "mobile") ? this.__filterMobilePlugins(plugins) : plugins,
            combinedPlugins = this.__combinePlugins(forcedPlugins, platformPlugins);
        return Tools.extend(settings, {
            plugins: combinedPlugins.join(' ')
        });
    }
}