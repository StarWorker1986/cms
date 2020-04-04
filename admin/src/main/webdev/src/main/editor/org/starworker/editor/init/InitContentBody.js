import EditorUpload from "../EditorUpload";
import ForceBlocks from "../ForceBlocks";
import NodeChange from "../NodeChange";
import SelectionOverrides from "../SelectionOverrides";
import UndoManager from "../UndoManager";
import Annotator from "../Annotator";
import Formatter from "../Formatter";
import Serializer from "../dom/Serializer";
import DOMUtils from "../dom/DOMUtils";
import Selection from "../dom/Selection";
import DomParser from "../html/DomParser";
import Node from "../html/Node";
import Schema from "../html/Schema";
import KeyboardOverrides from "../keyboard/KeyboardOverrides";
import Delay from "../util/Delay";
import Quirks from "../util/Quirks";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import MultiClickSelection from "../selection/MultiClickSelection";
import DetailsElement from "../selection/DetailsElement";
import Settings from "../Settings";

export default class initContentBody {
    static initContentBody(editor, skipWrite) {
        let settings = editor.settings, targetElm = editor.getElement(),
            dom = DOMUtils.DOM, doc = editor.getDoc(), body, contentCssText;

        // Restore visibility on target element
        if (!settings.inline) {
            editor.getElement().style.visibility = editor.orgVisibility;
        }

        // Setup iframe body
        if (!skipWrite && !editor.inline) {
            doc.open();
            doc.write(editor.iframeHTML);
            doc.close();
        }

        if (editor.inline) {
            editor.on("remove", () => {
                let bodyEl = this.getBody();
                dom.removeClass(bodyEl, "editor-content-body");
                dom.removeClass(bodyEl, "editor-edit-focus");
                dom.setAttrib(bodyEl, "contentEditable", null);
            });

            dom.addClass(targetElm, "editor-content-body");
            editor.contentDocument = doc = settings.contentCocument || document;
            editor.contentWindow = settings.contentWindow || window;
            editor.bodyElement = targetElm;
            editor.contentAreaContainer = targetElm;

            // Prevent leak in IE
            settings.contentDocument = settings.contentWindow = null;
            settings.rootName = targetElm.nodeName.toLowerCase();
        }

        // It will not steal focus while setting contentEditable
        body = editor.getBody();
        body.disabled = true;
        editor.readonly = settings.readonly;
        if (!editor.readonly) {
            if (editor.inline && dom.getStyle(body, "position", true) === "static") {
                body.style.position = "relative";
            }
            body.contentEditable = editor.getParam("contentEditableState", true);
        }

        body.disabled = false;
        editor.editorUpload = new EditorUpload(editor);
        editor.schema = Schema(settings);
        editor.dom = new DOMUtils(doc, {
            keepValues: true,
            urlConverter: editor.convertURL,
            urlConverterScope: editor,
            hexColors: settings.forceHexStyleColors,
            classFilter: settings.classFilter,
            updateStyles: true,
            rootElement: editor.inline ? editor.getBody() : null,
            collect: () => editor.inline,
            schema: editor.schema,
            contentCssCors: Settings.shouldUseContentCssCors(editor),
            onSetAttrib: (e) => {
                editor.fire("SetAttrib", e);
            }
        });

        editor.parser = this.__createParser(editor);
        editor.serializer = new Serializer(settings, editor);
        editor.selection = new Selection(editor.dom, editor.getWin(), editor.serializer, editor);
        editor.annotator = new Annotator(editor);
        editor.formatter = new Formatter(editor);
        editor.undoManager = new UndoManager(editor);
        editor._nodeChangeDispatcher = new NodeChange(editor);
        editor._selectionOverrides = new SelectionOverrides(editor);
        DetailsElement.setup(editor);
        MultiClickSelection.setup(editor);
        //KeyboardOverrides.setup(editor);
        ForceBlocks.setup(editor);

        editor.fire("PreInit");
        if (!settings.browserSpellcheck && !settings.geckoSpellcheck) {
            doc.body.spellcheck = false;
            dom.setAttrib(body, "spellcheck", "false");
        }

        editor.quirks = new Quirks(editor);
        editor.fire("PostRender");
        if (settings.directionality) {
            body.dir = settings.directionality;
        }

        if (settings.protect) {
            editor.on("BeforeSetContent", (e) => {
                ArrUtils.each(settings.protect, (pattern) => {
                    e.content = e.content.replace(pattern, (str) => {
                        return "<!--editor:protected " + escape(str) + "-->";
                    });
                });
            });
        }

        editor.on("SetContent", () => {
            editor.addVisual(editor.getBody());
        });

        editor.load({ initial: true, format: "html" });
        editor.startContent = editor.getContent({ format: "raw" });
        editor.on("compositionstart compositionend", (e) => {
            editor.composing = e.type === "compositionstart";
        });

        // Add editor specific CSS styles
        if (editor.contentStyles.length > 0) {
            contentCssText = '';
            ArrUtils.each(editor.contentStyles, (style) => {
                contentCssText += style + "\r\n";
            });
            editor.dom.addStyle(contentCssText);
        }
        
        let styleLoader = editor.inline ? dom.styleSheetLoader : editor.dom.styleSheetLoader,
            initEditor = (editor) => { this.__initEditor(editor) }; 
        styleLoader.loadAll(editor.contentCSS, (_) => {
            initEditor(editor);
        },
        (urls) => {
            initEditor(editor);
        });

        // Append specified content CSS last
        if (settings.contentStyle) {
            this.__appendStyle(editor, settings.contentStyle);
        }
    }

    static __appendStyle(editor, text) {
        let head = DOMUtils.fromDom(editor.getDoc().head), tag = DOMUtils.fromTag("style");
        editor.dom.setAttrib(tag.dom(), "type", "text/css")
        DOMUtils.append(tag, DOMUtils.fromText(text));
        DOMUtils.append(head, tag);
    }

    static __autoFocus(editor) {
        if (editor.settings.autoFocus) {
            Delay.setEditorTimeout(editor, () => {
                let focusEditor;
                if (editor.settings.autoFocus === true) {
                    focusEditor = editor;
                }
                else {
                    focusEditor = editor.editorManager.get(editor.settings.autoFocus);
                }
                if (!focusEditor.destroyed) {
                    focusEditor.focus();
                }
            }, 100);
        }
    }

    static __createParser(editor) {
        let parser = new DomParser(editor.settings, editor.schema);

        parser.addAttributeFilter("src,href,style,tabindex", (nodes, name) => {
            let i = nodes.length, node, dom = editor.dom, value, internalName;
            
            while (i--) {
                node = nodes[i];
                value = node.attr(name);
                internalName = "data-editor-" + name;

                if (!node.attributes.map[internalName]) {
                    if (value.indexOf("data:") === 0 || value.indexOf("blob:") === 0) {
                        continue;
                    }

                    if (name === "style") {
                        value = dom.serializeStyle(dom.parseStyle(value), node.name);
                        if (!value.length) {
                            value = null;
                        }
                        node.attr(internalName, value);
                        node.attr(name, value);
                    }
                    else if (name === "tabindex") {
                        node.attr(internalName, value);
                        node.attr(name, null);
                    }
                    else {
                        node.attr(internalName, editor.convertURL(value, name, node.name));
                    }
                }
            }
        });

        // Keep scripts from executing
        parser.addNodeFilter("script", (nodes) => {
            let i = nodes.length, node, type;
            while (i--) {
                node = nodes[i];
                type = node.attr("type") || "no/type";
                if (type.indexOf("editor-") !== 0) {
                    node.attr("type", "editor-" + type);
                }
            }
        });

        parser.addNodeFilter("#cdata", (nodes) => {
            let i = nodes.length, node;
            while (i--) {
                node = nodes[i];
                node.type = 8;
                node.name = "#comment";
                node.value = "[CDATA[" + node.value + "]]";
            }
        });

        parser.addNodeFilter("p,h1,h2,h3,h4,h5,h6,div", (nodes) => {
            let i = nodes.length, node, nonEmptyElements = editor.schema.getNonEmptyElements();
            while (i--) {
                node = nodes[i];
                if (node.isEmpty(nonEmptyElements) && node.getAll("br").length === 0) {
                    node.append(new Node("br", 1)).shortEnded = true;
                }
            }
        });

        return parser;
    }

    static __initEditor(editor) {
        editor.bindPendingEventDelegates();
        editor.initialized = true;
        editor.fire("init");
        editor.focus(true);
        editor.nodeChanged({ initial: true });
        editor.execCallback("initInstanceCallback", editor);
        this.__autoFocus(editor);
    }
}