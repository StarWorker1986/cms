import Tools from "../util/Tools";
import Env from "../util/Env";
import I18n from "../util/I18n";
import DOMUtils from "../dom/DOMUtils";
import EventUtils from "../dom/EventUtils";
import ScriptLoader from "../dom/ScriptLoader";
import Entities from "../html/Entities";
import NotificationManager from "../NotificationManager";
import WindowManager from "../WindowManager";
import ErrorReporter from "../ErrorReporter";
import Init from "./Init";
import PluginManager from "../PluginManager";
import ThemeManager from "../ThemeManager";
import Settings from "../Settings";

export default class Render {
    static render(editor) {
        let DOM = DOMUtils.DOM, settings = editor.settings, id = editor.id;
        
        I18n.setCode(Settings.getLanguageCode(editor));
        
        // Page is not loaded yet, wait for it
        if (!EventUtils.Event.domLoaded) {
            DOM.bind(window, "ready", this.__readyHandler);
            return;
        }

        // Element not found, then skip initialization
        if (!editor.getElement()) {
            return;
        }

        // No editable support old iOS versions etc
        if (!Env.contentEditable) {
            return;
        }

        // Hide target element early to prevent content flashing
        if (!settings.inline) {
            editor.orgVisibility = editor.getElement().style.visibility;
            editor.getElement().style.visibility = "hidden";
        }
        else {
            editor.inline = true;
        }

        let form = editor.getElement().form || DOM.getParent(id, "form");
        if (form) {
            editor.formElement = form;

            if (settings.hiddenInput && !/TEXTAREA|INPUT/i.test(editor.getElement().nodeName)) {
                $('<input type="hidden" name="' + id + '" />').insertAfter('#' + id);
                editor.hasHiddenInput = true;
            }

            editor.formEventDelegate = (e) => {
                editor.fire(e.type, e);
            };
            DOM.bind(form, "submit reset", editor.formEventDelegate);

            // Reset contents in editor when the form is reset
            editor.on("reset", () => {
                editor.setContent(editor.startContent, { format: "raw" });
            });

            if (settings.submitPatch && !form.submit.nodeType && !form.submit.length && !form._editorOldSubmit) {
                form._editorOldSubmit = form.submit;
                form.submit = () => {
                    editor.editorManager.triggerSave();
                    editor.setDirty(false);
                    return form._editorOldSubmit(form);
                };
            }
        }

        editor.windowManager = new WindowManager(editor);
        editor.notificationManager = new NotificationManager(editor);

        if (settings.encoding === "xml") {
            editor.on("GetContent", (e) => {
                if (e.save) {
                    e.content = Entities.encodeAllRaw(e.content);
                }
            });
        }

        if (settings.addFormSubmitTrigger) {
            editor.on("submit", () => {
                if (editor.initialized) {
                    editor.save();
                }
            });
        }

        if (settings.addUnloadTrigger) {
            editor._beforeUnload = () => {
                if (editor.initialized && !editor.destroyed && !editor.isHidden()) {
                    editor.save({ format: "raw", noEvents: true, setDirty: false });
                }
            };
            editor.editorManager.on("BeforeUnload", editor._beforeUnload);
        }
        editor.editorManager.add(editor);
        //loadScripts(editor, editor.suffix);
    }

    static __loadIcons(settings, editor) {
        var iconPackName = settings.icons;
        if (Tools.isString(iconPackName)) {
            var urlString = editor.editorManager.baseURL + "/icons/" + Tools.trim(iconPackName) + "/icons.js";
            ScriptLoader.scriptLoader.add(urlString);
        }
    }
    
    static __loadLanguage(scriptLoader, editor) {
        var languageCode = Settings.getLanguageCode(editor);
        var languageUrl = Settings.getLanguageUrl(editor);
        if (I18n.hasCode(languageCode) === false && languageCode !== "en") {
            if (languageUrl !== "") {
                scriptLoader.add(languageUrl);
            }
            else {
                scriptLoader.add(editor.editorManager.baseURL + "/langs/" + languageCode + ".js");
            }
        }
    }

    static __loadScripts(editor, suffix) {
        let scriptLoader = ScriptLoader.scriptLoader;
        loadTheme(scriptLoader, editor, suffix, function () {
            loadLanguage(scriptLoader, editor);
            loadIcons(editor.settings, editor);
            loadPlugins(editor.settings, suffix);
            scriptLoader.loadQueue(function () {
                if (!editor.removed) {
                    Init.init(editor);
                }
            }, editor, function (urls) {
                ErrorReporter.pluginLoadError(editor, urls[0]);
                if (!editor.removed) {
                    Init.init(editor);
                }
            });
        });
    }

    static __loadPlugins(settings, suffix) {
        if (Tools.isArray(settings.plugins)) {
            settings.plugins = settings.plugins.join(" ");
        }
        Tools.each(settings.external_plugins, function (url, name) {
            PluginManager.load(name, url);
            settings.plugins += " " + name;
        });
        Tools.each(settings.plugins.split(/[ ,]/), function (plugin) {
            plugin = Tools.trim(plugin);
            if (plugin && !PluginManager.urls[plugin]) {
                if (plugin.charAt(0) === '-') {
                    plugin = plugin.substr(1, plugin.length);
                    var dependencies = PluginManager.dependencies(plugin);
                    Tools.each(dependencies, function (dep) {
                        var defaultSettings = {
                            prefix: "plugins/",
                            resource: dep,
                            suffix: "/plugin" + suffix + ".js"
                        };
                        dep = PluginManager.createUrl(defaultSettings, dep);
                        PluginManager.load(dep.resource, dep);
                    });
                }
                else {
                    PluginManager.load(plugin, {
                        prefix: "plugins/",
                        resource: plugin,
                        suffix: "/plugin" + suffix + ".js"
                    });
                }
            }
        });
    }

    static __loadTheme(scriptLoader, editor, suffix, callback) {
        let settings = editor.settings, theme = settings.theme;
        if (Tools.isString(theme)) {
            if (!theme.charAt(0) === '-' && !ThemeManager.urls.hasOwnProperty(theme)) {
                var themeUrl = settings.theme_url;
                if (themeUrl) {
                    ThemeManager.load(theme, editor.documentBaseURI.toAbsolute(themeUrl));
                }
                else {
                    ThemeManager.load(theme, "themes/" + theme + "/theme" + suffix + ".js");
                }
            }
            scriptLoader.loadQueue(function () {
                ThemeManager.waitFor(theme, callback);
            });
        }
        else {
            callback();
        }
    }

    static __readyHandler(editor) {
        DOMUtils.DOM.unbind(window, "ready", this.__readyHandler);
        editor.render();
    }
}