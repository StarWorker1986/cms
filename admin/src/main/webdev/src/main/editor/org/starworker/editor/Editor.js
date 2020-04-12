import EditorContent from "../content/EditorContent";
import EditorRemove from "../EditorRemove";
import EditorSettings from "../EditorSettings";
import EditorFocus from "../focus/EditorFocus";
import Render from "../init/Render";
import Mode from "../Mode";
import { AddOnManager } from "./AddOnManager";
import DOMUtils from "./dom/DOMUtils";
import EditorCommands from "./EditorCommands";
import EditorObservable from "./EditorObservable";
import Env from "./util/Env";
import Shortcuts from "./Shortcuts";
import Tools from "./util/Tools";
import ArrUtils from "./util/ArrUtils";
import URI from "./util/URI";
import I18n from "../util/I18n";

export default class Editor {
    constructor(id, settings, editorManager) {
        settings = EditorSettings.getEditorSettings(this, id, editorManager.documentBaseURL,
                                                    editorManager.defaultSettings, settings);
        this.setDirty(false);
        this.id = id;
        this.settings = settings;
        this.editorManager = editorManager;
        this.documentBaseUrl = editorManager.documentBaseURL;
        this.plugins = {};
        this.baseURI = editorManager.baseURI;
        this.documentBaseURI = new URI(settings.documentBaseUrl, {
            baseUri: editorManager.baseURI
        });
        this.contentCSS = [];
        this.contentStyles = [];
        //self.shortcuts = new Shortcuts(self);
        this.loadedCSS = {};
        this.editorCommands = new EditorCommands(self);
        this.suffix = editorManager.suffix;
        this.editorManager = editorManager;
        this.inline = settings.inline;
        this.buttons = {};
        this.menuItems = {};

        if (settings.cacheSuffix) {
            Env.cacheSuffix = settings.cacheSuffix.replace(/^[\?\&]+/, '');
        }
        if (settings.overrideViewport === false) {
            Env.overrideViewPort = false;
        }

        editorManager.fire("SetupEditor", { editor: this });
        this.execCallback("setup", this);

        self.$ = DOMUtils.$(this.getBody(), this.inline ? this.getBody() : this.getDoc());
    }

    addCommand(name, callback, scope) {
        this.editorCommands.addCommand(name, callback, scope);
    }

    addQueryStateHandler(name, callback, scope) {
        this.editorCommands.addQueryStateHandler(name, callback, scope);
    }
   
    addQueryValueHandler(name, callback, scope) {
        this.editorCommands.addQueryValueHandler(name, callback, scope);
    }
   
    addShortcut(pattern, desc, cmdFunc, scope) {
        this.shortcuts.add(pattern, desc, cmdFunc, scope);
    }

    addVisual(elm) {
        let self = this, settings = self.settings, dom = self.dom, cls;

        elm = elm || self.getBody();
        if (self.hasVisual === undefined) {
            self.hasVisual = settings.visual;
        }

        ArrUtils.each(dom.select("table,a", elm), (elm) => {
            let value;
            switch (elm.nodeName) {
                case "TABLE":
                    cls = settings.visualTableClass || "editor-item-table";
                    value = dom.getAttrib(elm, "border");
                    if ((!value || value === "0") && self.hasVisual) {
                        dom.addClass(elm, cls);
                    }
                    else {
                        dom.removeClass(elm, cls);
                    }
                    return;
                case "A":
                    if (!dom.getAttrib(elm, "href")) {
                        value = dom.getAttrib(elm, "name") || elm.id;
                        cls = settings.visualAnchorClass || "editor-item-anchor";
                        if (value && self.hasVisual) {
                            dom.addClass(elm, cls);
                        }
                        else {
                            dom.removeClass(elm, cls);
                        }
                    }
                    return;
            }
        });
        self.fire("VisualAid", { element: elm, hasVisual: self.hasVisual });
    }

    convertURL(url, name, elm) {
        let self = this, settings = self.settings;

        if (settings.urlconverterCallback) {
            return self.execCallback("urlconverterCallback", url, elm, true, name);
        }
        if (!settings.convertUrls || (elm && elm.nodeName === "LINK") || url.indexOf("file:") === 0 || url.length === 0) {
            return url;
        }
        if (settings.relativeUrls) {
            return self.documentBaseURI.toRelative(url);
        }
        url = self.documentBaseURI.toAbsolute(url, settings.removeScriptHost);

        return url;
    }

    execCallback(name) {
        let self = this, callback = self.settings[name], scope;
        if (!callback) {
            return;
        }

        if (self.callbackLookup && (scope = self.callbackLookup[name])) {
            callback = scope.func;
            scope = scope.scope;
        }

        if (typeof callback === "string") {
            scope = callback.replace(/\.\w+$/, '');
            scope = scope ? Tools.resolve(scope) : 0;
            callback = Tools.resolve(callback);
            self.callbackLookup = self.callbackLookup || {};
            self.callbackLookup[name] = { func: callback, scope: scope };
        }
        return callback.apply(scope || self, Array.prototype.slice.call(arguments, 1));
    }

    execCommand(cmd, ui, value, args) {
        return this.editorCommands.execCommand(cmd, ui, value, args);
    }

    focus(skipFocus) {
        EditorFocus.focus(this, skipFocus);
    }

    getContent(args) {
        return EditorContent.getContent(this, args);
    }

    hide() {
        let self = this, doc = self.getDoc(), DOM = DOMUtils.DOM;
        if (!self.hidden) {
            if (Env.ie && doc && !self.inline) {
                doc.execCommand("SelectAll");
            }
            self.save();

            if (self.inline) {
                self.getBody().contentEditable = false;
                if (self === self.editorManager.focusedEditor) {
                    self.editorManager.focusedEditor = null;
                }
            }
            else {
                DOM.hide(self.getContainer());
                DOM.setStyle(self.id, "display", self.orgDisplay);
            }
            self.hidden = true;
            self.fire("hide");
        }
    }

    nodeChanged(args) {
        this._nodeChangeDispatcher.nodeChanged(args);
    }

    getParam(name, defaultVal, type) {
        return EditorSettings.getParam(this, name, defaultVal, type);
    }

    getContainer() {
        let self = this;
        if (!self.container) {
            self.container = DOMUtils.DOM.get(self.editorContainer || self.id + "_parent");
        }
        return self.container;
    }
    
    getContentAreaContainer() {
        return this.contentAreaContainer;
    }
    
    getElement() {
        if (!this.targetElm) {
            this.targetElm = DOMUtils.DOM.get(this.id);
        }
        return this.targetElm;
    }
    
    getWin() {
        let self = this, elm;
        if (!self.contentWindow) {
            elm = self.iframeElement;
            if (elm) {
                self.contentWindow = elm.contentWindow;
            }
        }
        return self.contentWindow;
    }
    
    getDoc() {
        let self = this, win;
        if (!self.contentDocument) {
            win = self.getWin();
            if (win) {
                self.contentDocument = win.document;
            }
        }
        return self.contentDocument;
    }

    getBody() {
        let doc = this.getDoc();
        return this.bodyElement || (doc ? doc.body : null);
    }

    hasFocus() {
        return EditorFocus.hasFocus(this);
    }

    isHidden() {
        return !!this.hidden;
    }

    insertContent(content, args) {
        if (args) {
            content = Tools.extend({ content: content }, args);
        }
        this.execCommand("editorInsertContent", false, content);
    }
   
    isDirty() {
        return !this.isNotDirty;
    }

    load(args) {
        let self = this, elm = self.getElement(), html;
        if (self.removed) {
            return '';
        }

        if (elm) {
            args = args || {};
            args.load = true;
            html = self.setContent(elm.value !== undefined ? elm.value : elm.innerHTML, args);
            args.element = elm;
            if (!args.noEvents) {
                self.fire("LoadContent", args);
            }
            args.element = elm = null;
            return html;
        }
    }

    render() {
        Render.render(this);
    }

    remove() {
        EditorRemove.remove(this);
    }

    save(args) {
        let self = this, elm = self.getElement(), html, form;
        if (!elm || !self.initialized || self.removed) {
            return;
        }

        args = args || {};
        args.save = true;
        args.element = elm;
        html = args.content = self.getContent(args);
        if (!args.noEvents) {
            self.fire("SaveContent", args);
        }

        if (args.format === "raw") {
            self.fire("RawSaveContent", args);
        }

        html = args.content;
        if (!/TEXTAREA|INPUT/i.test(elm.nodeName)) {
            if (args.isRemoving || !self.inline) {
                elm.innerHTML = html;
            }

            if ((form = DOMUtils.DOM.getParent(self.id, "form"))) {
                ArrUtils.each(form.elements, (elm) => {
                    if (elm.name === self.id) {
                        elm.value = html;
                        return false;
                    }
                });
            }
        }
        else {
            elm.value = html;
        }
        args.element = elm = null;
        if (args.setDirty !== false) {
            self.setDirty(false);
        }

        return html;
    }

    setContent(content, args) {
        return EditorContent.setContent(this, content, args);
    }

    setDirty(state) {
        let oldState = !this.isNotDirty;
        this.isNotDirty = !state;
        if (state && state !== oldState) {
            this.fire("dirty");
        }
    }

    setMode(mode) {
        Mode.setMode(this, mode);
    }

    setProgressState(state, time) {
        this.fire("ProgressState", { state: state, time: time });
    }

    show() {
        let self = this, DOM = DOMUtils.DOM;
        if (self.hidden) {
            self.hidden = false;
            if (self.inline) {
                self.getBody().contentEditable = true;
            }
            else {
                DOM.show(self.getContainer());
                DOM.hide(self.id);
            }
            self.load();
            self.fire("show");
        }
    }

    translate(text) {
        return I18n.translate(text);
    }

    queryCommandState(cmd) {
        return this.editorCommands.queryCommandState(cmd);
    }
   
    queryCommandValue(cmd) {
        return this.editorCommands.queryCommandValue(cmd);
    }

    queryCommandSupported(cmd) {
        return this.editorCommands.queryCommandSupported(cmd);
    }
}
Tools.extend(Editor, EditorObservable);