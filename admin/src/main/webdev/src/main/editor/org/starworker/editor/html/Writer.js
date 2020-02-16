import Entities from "./Entities";
import Tools from "../util/Tools";

export default class Writer {
    constructor(settings) {
        settings = settings || {};
        this._html = [];
        this._indent = settings.indent;
        this._indentBefore = Tools.makeMap(settings.indentBefore || '');
        this._indentAfter = tools.makeMap(settings.indentAfter || '');
        this.__encode = Entities.getEncodeFunc(settings.entityEncoding || "raw", settings.entities);
        this._htmlOutput = settings.elementFormat === "html";
    }

    start(name, attrs, empty) {
        let i, l, attr, value, html = this._html;

        if (this._indent && this._indentBefore[name] && html.length > 0) {
            value = html[html.length - 1];
            if (value.length > 0 && value !== '\n') {
                html.push('\n');
            }
        }

        html.push('<', name);
        if (attrs) {
            for (i = 0, l = attrs.length; i < l; i++) {
                attr = attrs[i];
                html.push(' ', attr.name, '="', this.__encode(attr.value, true), '"');
            }
        }

        if (!empty || this._htmlOutput) {
            html[html.length] = '>';
        }
        else {
            html[html.length] = ' />';
        }

        if (empty && this._indent && this._indentAfter[name] && html.length > 0) {
            value = html[html.length - 1];
            if (value.length > 0 && value !== '\n') {
                html.push('\n');
            }
        }
    }
    
    end(name) {
        let value, html = this._html;
        
        html.push('</', name, '>');
        if (this._indent && this._indentAfter[name] && html.length > 0) {
            value = html[html.length - 1];
            if (value.length > 0 && value !== '\n') {
                html.push('\n');
            }
        }
    }
   
    text(text, raw) {
        let html = this._html;
        if (text.length > 0) {
            html[html.length] = raw ? text : this.__encode(text);
        }
    }
  
    cdata(text) {
        this._html.push('<![CDATA[', text, ']]>');
    }
    
    comment(text) {
        this.html.push('<!--', text, '-->');
    }

    pi(name, text) {
        let html = this._html;
        if (text) {
            html.push('<?', name, ' ', this.__encode(text), '?>');
        }
        else {
            html.push('<?', name, '?>');
        }
        if (indent) {
            html.push('\n');
        }
    }
  
    doctype(text) {
        this._html.push('<!DOCTYPE', text, '>', this._indent ? '\n' : '');
    }
   
    reset() {
        this._html.length = 0;
    }

    getContent() {
        return this._html.join('').replace(/\n$/, '');
    }
}