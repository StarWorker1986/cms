import Env from "../util/Env";
import Uuid from "../util/Uuid";
import DOMUtils from "../dom/DOMUtils";
import Settings from "../Settings";
import InitContentBody from "./InitContentBody";

export default class InitIframe {
    static init(editor, boxInfo) {
        let DOM = DOMUtils.DOM, isDomainRelaxed = this.__createIframe(editor, boxInfo);

        if (boxInfo.editorContainer) {
            DOM.get(boxInfo.editorContainer).style.display = editor.orgDisplay;
            editor.hidden = DOM.isHidden(boxInfo.editorContainer);
        }
        editor.getElement().style.display = "none";
        DOM.setAttrib(editor.id, "aria-hidden", "true");
        if (!isDomainRelaxed) {
            InitContentBody.initContentBody(editor);
        }
    }

    static __createIframe(editor, o) {
        let title = editor.editorManager.translate("Rich Text Area. Press ALT-0 for help."),
            ifr = this.__createIframeElement(editor.id, title, o.height, Settings.getIframeAttrs(editor)).dom();
        ifr.onload = () => {
            ifr.onload = null;
            editor.fire("load");
        };

        let isDomainRelaxed = this.__relaxDomain(editor, ifr);

        editor.contentAreaContainer = o.iframeContainer;
        editor.iframeElement = ifr;
        editor.iframeHTML = this.__getIframeHtml(editor);
        DOMUtils.DOM.add(o.iframeContainer, ifr);

        return isDomainRelaxed;
    }

    static __getIframeHtml(editor) {
        let bodyId, bodyClass, iframeHTML;

        iframeHTML = Settings.getDocType(editor) + '<html><head>';
        if (Settings.getDocumentBaseUrl(editor) !== editor.documentBaseUrl) {
            iframeHTML += '<base href="' + editor.documentBaseURI.getURI() + '" />';
        }
        iframeHTML += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';

        bodyId = Settings.getBodyId(editor);
        bodyClass = Settings.getBodyClass(editor);
        
        if (Settings.getContentSecurityPolicy(editor)) {
            iframeHTML += '<meta http-equiv="Content-Security-Policy" content="'
                       + Settings.getContentSecurityPolicy(editor) + '" />';
        }
        iframeHTML += '</head><body id="' + bodyId + '" class="editor-content-body ' + bodyClass
                   + '" data-id="' + editor.id + '"><br></body></html>';

        return iframeHTML;
    }

    __relaxDomain(editor, ifr) {
        if (document.domain !== window.location.hostname && Env.ie && Env.ie < 12) {
            let bodyUuid = Uuid.uuid("editor");
            editor[bodyUuid] = () => {
                InitContentBody.initContentBody(editor);
            };

            let domainRelaxUrl = 'javascript:(function() { '
                               + 'document.open(); document.domain="' + document.domain + '";'
                               + 'let ed = window.parent.editor.get("' + editor.id + '");'
                               + 'document.write(ed.iframeHTML); document.close();ed.' + bodyUuid + '(true); })()';
            DOMUtils.DOM.setAttrib(ifr, "src", domainRelaxUrl);
            return true;
        }
        return false;
    }
}