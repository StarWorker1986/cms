import EditorUpload from '../api/EditorUpload';
import ForceBlocks from '../ForceBlocks';
import NodeChange from '../NodeChange';
import SelectionOverrides from '../SelectionOverrides';
import UndoManager from '../api/UndoManager';
import Annotator from '../api/Annotator';
import Formatter from '../api/Formatter';
import Serializer from '../api/dom/Serializer';
import DOMUtils from '../api/dom/DOMUtils';
import { Selection } from '../api/dom/Selection';
import DomParser from '../api/html/DomParser';
import Node from '../api/html/Node';
import Schema from '../api/html/Schema';
import KeyboardOverrides from '../keyboard/KeyboardOverrides';
import Delay from '../api/util/Delay';
import Quirks from '../util/Quirks';
import Tools from '../api/util/Tools';
import * as MultiClickSelection from 'tinymce/core/selection/MultiClickSelection';
import * as DetailsElement from '../selection/DetailsElement';
import { document, window } from '@ephox/dom-globals';
import Settings from '../api/Settings';
var DOM = DOMUtils.DOM;
var appendStyle = function (editor, text) {
    var head = DOMUtils.fromDom(editor.getDoc().head);
    var tag = DOMUtils.fromTag('style');
    $(tag.dom()).attr("type", "text/css");
    DOMUtils.append(tag, DOMUtils.fromText(text));
    DOMUtils.append(head, tag);
};
var createParser = function (editor) {
    var parser = DomParser(editor.settings, editor.schema);
    // Convert src and href into data-mce-src, data-mce-href and data-mce-style
    parser.addAttributeFilter('src,href,style,tabindex', function (nodes, name) {
        var i = nodes.length, node;
        var dom = editor.dom;
        var value, internalName;
        while (i--) {
            node = nodes[i];
            value = node.attr(name);
            internalName = 'data-mce-' + name;
            // Add internal attribute if we need to we don't on a refresh of the document
            if (!node.attributes.map[internalName]) {
                // Don't duplicate these since they won't get modified by any browser
                if (value.indexOf('data:') === 0 || value.indexOf('blob:') === 0) {
                    continue;
                }
                if (name === 'style') {
                    value = dom.serializeStyle(dom.parseStyle(value), node.name);
                    if (!value.length) {
                        value = null;
                    }
                    node.attr(internalName, value);
                    node.attr(name, value);
                }
                else if (name === 'tabindex') {
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
    parser.addNodeFilter('script', function (nodes) {
        var i = nodes.length, node, type;
        while (i--) {
            node = nodes[i];
            type = node.attr('type') || 'no/type';
            if (type.indexOf('mce-') !== 0) {
                node.attr('type', 'mce-' + type);
            }
        }
    });
    parser.addNodeFilter('#cdata', function (nodes) {
        var i = nodes.length, node;
        while (i--) {
            node = nodes[i];
            node.type = 8;
            node.name = '#comment';
            node.value = '[CDATA[' + node.value + ']]';
        }
    });
    parser.addNodeFilter('p,h1,h2,h3,h4,h5,h6,div', function (nodes) {
        var i = nodes.length, node;
        var nonEmptyElements = editor.schema.getNonEmptyElements();
        while (i--) {
            node = nodes[i];
            if (node.isEmpty(nonEmptyElements) && node.getAll('br').length === 0) {
                node.append(new Node('br', 1)).shortEnded = true;
            }
        }
    });
    return parser;
};
var autoFocus = function (editor) {
    if (editor.settings.auto_focus) {
        Delay.setEditorTimeout(editor, function () {
            var focusEditor;
            if (editor.settings.auto_focus === true) {
                focusEditor = editor;
            }
            else {
                focusEditor = editor.editorManager.get(editor.settings.auto_focus);
            }
            if (!focusEditor.destroyed) {
                focusEditor.focus();
            }
        }, 100);
    }
};
var initEditor = function (editor) {
    editor.bindPendingEventDelegates();
    editor.initialized = true;
    editor.fire('init');
    editor.focus(true);
    editor.nodeChanged({ initial: true });
    editor.execCallback('init_instance_callback', editor);
    autoFocus(editor);
};
var getStyleSheetLoader = function (editor) {
    return editor.inline ? DOM.styleSheetLoader : editor.dom.styleSheetLoader;
};
var initContentBody = function (editor, skipWrite) {
    var settings = editor.settings;
    var targetElm = editor.getElement();
    var doc = editor.getDoc(), body, contentCssText;
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
        editor.on('remove', function () {
            var bodyEl = this.getBody();
            DOM.removeClass(bodyEl, 'mce-content-body');
            DOM.removeClass(bodyEl, 'mce-edit-focus');
            DOM.setAttrib(bodyEl, 'contentEditable', null);
        });
        DOM.addClass(targetElm, 'mce-content-body');
        editor.contentDocument = doc = settings.content_document || document;
        editor.contentWindow = settings.content_window || window;
        editor.bodyElement = targetElm;
        editor.contentAreaContainer = targetElm;
        // Prevent leak in IE
        settings.content_document = settings.content_window = null;
        // TODO: Fix this
        settings.root_name = targetElm.nodeName.toLowerCase();
    }
    // It will not steal focus while setting contentEditable
    body = editor.getBody();
    body.disabled = true;
    editor.readonly = settings.readonly;
    if (!editor.readonly) {
        if (editor.inline && DOM.getStyle(body, 'position', true) === 'static') {
            body.style.position = 'relative';
        }
        body.contentEditable = editor.getParam('content_editable_state', true);
    }
    body.disabled = false;
    editor.editorUpload = EditorUpload(editor);
    editor.schema = Schema(settings);
    editor.dom = DOMUtils(doc, {
        keep_values: true,
        url_converter: editor.convertURL,
        url_converter_scope: editor,
        hex_colors: settings.force_hex_style_colors,
        class_filter: settings.class_filter,
        update_styles: true,
        root_element: editor.inline ? editor.getBody() : null,
        collect: function () { return editor.inline; },
        schema: editor.schema,
        contentCssCors: Settings.shouldUseContentCssCors(editor),
        onSetAttrib: function (e) {
            editor.fire('SetAttrib', e);
        }
    });
    editor.parser = createParser(editor);
    editor.serializer = Serializer(settings, editor);
    editor.selection = Selection(editor.dom, editor.getWin(), editor.serializer, editor);
    editor.annotator = Annotator(editor);
    editor.formatter = Formatter(editor);
    editor.undoManager = UndoManager(editor);
    editor._nodeChangeDispatcher = new NodeChange(editor);
    editor._selectionOverrides = SelectionOverrides(editor);
    DetailsElement.setup(editor);
    MultiClickSelection.setup(editor);
    KeyboardOverrides.setup(editor);
    ForceBlocks.setup(editor);
    editor.fire('PreInit');
    if (!settings.browser_spellcheck && !settings.gecko_spellcheck) {
        doc.body.spellcheck = false; // Gecko
        DOM.setAttrib(body, 'spellcheck', 'false');
    }
    editor.quirks = Quirks(editor);
    editor.fire('PostRender');
    if (settings.directionality) {
        body.dir = settings.directionality;
    }
    if (settings.protect) {
        editor.on('BeforeSetContent', function (e) {
            Tools.each(settings.protect, function (pattern) {
                e.content = e.content.replace(pattern, function (str) {
                    return '<!--mce:protected ' + escape(str) + '-->';
                });
            });
        });
    }
    editor.on('SetContent', function () {
        editor.addVisual(editor.getBody());
    });
    editor.load({ initial: true, format: 'html' });
    editor.startContent = editor.getContent({ format: 'raw' });
    editor.on('compositionstart compositionend', function (e) {
        editor.composing = e.type === 'compositionstart';
    });
    // Add editor specific CSS styles
    if (editor.contentStyles.length > 0) {
        contentCssText = '';
        Tools.each(editor.contentStyles, function (style) {
            contentCssText += style + '\r\n';
        });
        editor.dom.addStyle(contentCssText);
    }
    getStyleSheetLoader(editor).loadAll(editor.contentCSS, function (_) {
        initEditor(editor);
    }, function (urls) {
        initEditor(editor);
    });
    // Append specified content CSS last
    if (settings.content_style) {
        appendStyle(editor, settings.content_style);
    }
};
export default {
    initContentBody: initContentBody
};