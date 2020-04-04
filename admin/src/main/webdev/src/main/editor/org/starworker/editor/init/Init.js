import Objects from "../util/Objects";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import DOMUtils from "../dom/DOMUtils";
import IconManager from "../IconManager";
import PluginManager from "../PluginManager";
import ThemeManager from "../ThemeManager";
import ErrorReporter from "../ErrorReporter";
import InitContentBody from "./InitContentBody";
import InitIframe from "./InitIframe";
import ContentCss from "./ContentCss";

export default class Init {
    static init(editor) {
        //editor.fire("ScriptsLoaded");
        //initTheme(editor);
        //initPlugins(editor);
        //initIcons(editor);
        //var boxInfo = renderThemeUi(editor);
        //editor.editorContainer = boxInfo.editorContainer ? boxInfo.editorContainer : null;
        //appendContentCssFromSettings(editor);

        if (editor.inline) {
            return InitContentBody.initContentBody(editor);
        }
        else {
            return InitIframe.init(editor, boxInfo);
        }
    }

    static __initPlugin(editor, initializedPlugins, plugin) {
        let Plugin = PluginManager.get(plugin),
            pluginUrl = PluginManager.urls[plugin] || editor.documentBaseUrl.replace(/\/$/, '');
        
        plugin = Tools.trim(plugin);
        if (Plugin && ArrUtils.indexOf(initializedPlugins, plugin) === -1) {
            ArrUtils.each(PluginManager.dependencies(plugin), (dep) => {
                this.__initPlugin(editor, initializedPlugins, dep);
            });

            if (editor.plugins[plugin]) {
                return;
            }

            try {
                let pluginInstance = new Plugin(editor, pluginUrl, editor.$);
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
    }

    static __initPlugins(editor) {
        let initializedPlugins = [];
        ArrUtils.each(editor.settings.plugins.split(/[ ,]/), (name) => {
            this.__initPlugin(editor, initializedPlugins, name.replace(/^\-/, ''));
        });
    }

    static __initIcons(editor) {
        let iconPackName = Tools.trim(editor.settings.icons);
        Objects.each(IconManager.iconManager.get(iconPackName).icons, (svgData, name) => {
            editor.ui.registry.addIcon(name, svgData);
        });
    }

    static __initTheme(editor) {
        let theme = editor.settings.theme;
        if (Tools.isString(theme)) {
            editor.settings.theme = theme.replace(/^\-/, '');
            
            let Theme = ThemeManager.get(theme);
            editor.theme = new Theme(editor, ThemeManager.urls[theme]);
            if (editor.theme.init) {
                editor.theme.init(editor, ThemeManager.urls[theme] || editor.documentBaseUrl.replace(/\/$/, ''), editor.$);
            }
        }
        else {
            editor.theme = {};
        }
    }

    static __renderFromThemeFunc(editor) {
        let elm = editor.getElement(), info = editor.settings.theme(editor, elm);

        if (info.editorContainer.nodeType) {
            info.editorContainer.id = info.editorContainer.id || editor.id + "_parent";
        }
        if (info.iframeContainer && info.iframeContainer.nodeType) {
            info.iframeContainer.id = info.iframeContainer.id || editor.id + "_iframecontainer";
        }
        info.height = info.iframeHeight ? info.iframeHeight : elm.offsetHeight;

        return info;
    }

    static __createThemeFalseResult(element) {
        return {
            editorContainer: element,
            iframeContainer: element
        };
    }

    static __renderThemeFalseIframe(targetElement) {
        $('<div></div>').insertAfter(DOM.get(targetElement));
        return this.__createThemeFalseResult(iframeContainer);
    }

    static __renderThemeFalse(editor) {
        let targetElement = editor.getElement();
        return editor.inline ? this.__createThemeFalseResult(null) : renderThemeFalseIframe(targetElement);
    }

    static __renderThemeUi(editor) {
        let settings = editor.settings, elm = editor.getElement();

        editor.orgDisplay = elm.style.display;
        if (Tools.isString(settings.theme)) {
            return editor.theme.renderUI();
        }
        else if (Tools.isFunction(settings.theme)) {
            return this.__renderFromThemeFunc(editor);
        }
        else {
            return this.__renderThemeFalse(editor);
        }
    }
}