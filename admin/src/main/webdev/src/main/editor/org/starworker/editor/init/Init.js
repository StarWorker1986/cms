import Objects from "../util/Objects";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import IconManager from "../IconManager";
import PluginManager from "../api/PluginManager";
import ThemeManager from "../api/ThemeManager";
import DOMUtils from "../api/dom/DOMUtils";
import ErrorReporter from "../ErrorReporter";
import InitContentBody from "./InitContentBody";
import InitIframe from "./InitIframe";
import { appendContentCssFromSettings } from "./ContentCss";

var DOM = DOMUtils.DOM;
var initPlugin = function (editor, initializedPlugins, plugin) {
    var Plugin = PluginManager.get(plugin);
    var pluginUrl = PluginManager.urls[plugin] || editor.documentBaseUrl.replace(/\/$/, "");
    plugin = Tools.trim(plugin);
    if (Plugin && ArrUtils.indexOf(initializedPlugins, plugin) === -1) {
        ArrUtils.each(PluginManager.dependencies(plugin), function (dep) {
            initPlugin(editor, initializedPlugins, dep);
        });
        if (editor.plugins[plugin]) {
            return;
        }
        try {
            var pluginInstance = new Plugin(editor, pluginUrl, editor.$);
            editor.plugins[plugin] = pluginInstance;
            if (pluginInstance.init) {
                pluginInstance.init(editor, pluginUrl);
                initializedPlugins.push(plugin);
            }
        }
        catch (e) {
            ErrorReporter.pluginInitError(editor, plugin, e);
        }
    }
};
var trimLegacyPrefix = function (name) {
    // Themes and plugins can be prefixed with - to prevent them from being lazy loaded
    return name.replace(/^\-/, "");
};
var initPlugins = function (editor) {
    var initializedPlugins = [];
    ArrUtils.each(editor.settings.plugins.split(/[ ,]/), function (name) {
        initPlugin(editor, initializedPlugins, trimLegacyPrefix(name));
    });
};
var initIcons = function (editor) {
    var iconPackName = Tools.trim(editor.settings.icons);
    Objects.each(IconManager.iconManager.get(iconPackName).icons, function (svgData, name) {
        editor.ui.registry.addIcon(name, svgData);
    });
};
var initTheme = function (editor) {
    var theme = editor.settings.theme;
    if (Tools.isString(theme)) {
        editor.settings.theme = trimLegacyPrefix(theme);
        var Theme = ThemeManager.get(theme);
        editor.theme = new Theme(editor, ThemeManager.urls[theme]);
        if (editor.theme.init) {
            editor.theme.init(editor, ThemeManager.urls[theme] || editor.documentBaseUrl.replace(/\/$/, ""), editor.$);
        }
    }
    else {
        // Theme set to false or null doesn"t produce a theme api
        editor.theme = {};
    }
};
var renderFromLoadedTheme = function (editor) {
    // Render UI
    return editor.theme.renderUI();
};
var renderFromThemeFunc = function (editor) {
    var elm = editor.getElement();
    var info = editor.settings.theme(editor, elm);
    if (info.editorContainer.nodeType) {
        info.editorContainer.id = info.editorContainer.id || editor.id + "_parent";
    }
    if (info.iframeContainer && info.iframeContainer.nodeType) {
        info.iframeContainer.id = info.iframeContainer.id || editor.id + "_iframecontainer";
    }
    info.height = info.iframeHeight ? info.iframeHeight : elm.offsetHeight;
    return info;
};
var createThemeFalseResult = function (element) {
    return {
        editorContainer: element,
        iframeContainer: element
    };
};
var renderThemeFalseIframe = function (targetElement) {
    $('<div></div>').insertAfter(DOM.get(targetElement));
    return createThemeFalseResult(iframeContainer);
};
var renderThemeFalse = function (editor) {
    var targetElement = editor.getElement();
    return editor.inline ? createThemeFalseResult(null) : renderThemeFalseIframe(targetElement);
};
var renderThemeUi = function (editor) {
    var settings = editor.settings, elm = editor.getElement();
    editor.orgDisplay = elm.style.display;
    if (Tools.isString(settings.theme)) {
        return renderFromLoadedTheme(editor);
    }
    else if (Tools.isFunction(settings.theme)) {
        return renderFromThemeFunc(editor);
    }
    else {
        return renderThemeFalse(editor);
    }
};
var init = function (editor) {
    editor.fire("ScriptsLoaded");
    initTheme(editor);
    initPlugins(editor);
    initIcons(editor);
    var boxInfo = renderThemeUi(editor);
    editor.editorContainer = boxInfo.editorContainer ? boxInfo.editorContainer : null;
    appendContentCssFromSettings(editor);
    // Content editable mode ends here
    if (editor.inline) {
        return InitContentBody.initContentBody(editor);
    }
    else {
        return InitIframe.init(editor, boxInfo);
    }
};
export default {
    init: init
};