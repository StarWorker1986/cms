import ArrUtils from "./util/ArrUtils";
import Option from "./util/Option";
import Strings from "./util/Strings";

export default class Settings {
    static getIframeAttrs(editor) {
        return editor.getParam("iframeAttrs", {});
    }

    static getDocType(editor) {
        return editor.getParam("doctype", "<!DOCTYPE html>");
    }

    static getDocumentBaseUrl(editor) {
        return editor.getParam("documentBaseUrl", '');
    }

    static getBodyId(editor) {
        return this.__getBodySetting(editor, "bodyId", "editor");
    }

    static getBodyClass(editor) {
        return this.__getBodySetting(editor, "bodyClass", '');
    }

    static getContentSecurityPolicy(editor) {
        return editor.getParam("contentSecurityPolicy", '');
    }

    static shouldPutBrInPre(editor) {
        return editor.getParam("brInPre", true);
    }

    static getForcedRootBlock(editor) {
        // Legacy option
        if (editor.getParam("forceNewlines", false)) {
            return 'p';
        }

        let block = editor.getParam("forcedRootBlock", 'p');
        if (block === false) {
            return '';
        }
        else if (block === true) {
            return 'p';
        }
        else {
            return block;
        }
    }

    static getForcedRootBlockAttrs(editor) {
        return editor.getParam("forcedRootBlockAttrs", {});
    }

    static getBrNewLineSelector(editor) {
        return editor.getParam("brNewlineSelector", ".editor-toc h2,figcaption,caption");
    }

    static getNoNewLineSelector(editor) {
        return editor.getParam("noNewlineSelector", '');
    }

    static shouldKeepStyles(editor) {
        return editor.getParam("keepStyles", true);
    }

    static shouldEndContainerOnEmptyBlock(editor) {
        return editor.getParam("endContainerOnEmptyBlock", false);
    }

    static getFontStyleValues(editor) {
        return ArrUtils.explode(editor.getParam("fontSizeStyleValues", ''));
    }

    static getFontSizeClasses(editor) {
        return ArrUtils.explode(editor.getParam("fontSizeClasses", ''));
    }

    static getImagesDataImgFilter(editor) {
        return editor.getParam("imagesDataimgFilter", Option.constant(true), "function");
    }

    static isAutomaticUploadsEnabled(editor) {
        return editor.getParam("automaticUploads", true, "boolean");
    }

    static shouldReuseFileName(editor) {
        return editor.getParam("imagesReuseFilename", false, "boolean");
    }

    static shouldReplaceBlobUris(editor) {
        return editor.getParam("imagesReplaceBlobUris", true, "boolean");
    }

    static getImageUploadUrl(editor) {
        return editor.getParam("imagesUploadUrl", '', "string");
    }

    static getImageUploadBasePath(editor) {
        return editor.getParam("imagesUploadBasePath", '', "string");
    }

    static getImagesUploadCredentials(editor) {
        return editor.getParam("imagesUploadCredentials", false, "boolean");
    }

    static getImagesUploadHandler(editor) {
        return editor.getParam("imagesUploadHandler", null, "function");
    }

    static shouldUseContentCssCors(editor) {
        return editor.getParam("contentCssCors", false, "boolean");
    }

    static getLanguageCode(editor) {
        return editor.getParam("language", "en", "string");
    }

    static getLanguageUrl(editor) {
        return editor.getParam("languageUrl", '', "string");
    }

    static shouldIndentUseMargin(editor) {
        return editor.getParam("indentUseMargin", false);
    }

    static getIndentation(editor) {
        return editor.getParam("indentation", "40px", "string");
    }

    static getContentCss(editor) {
        let contentCss = editor.settings.contentCss;
        if (Tools.isString(contentCss)) {
            return Tools.map(contentCss.split(','), Strings.trim);
        }

        else if (Tools.isArray(contentCss)) {
            return contentCss;
        }
        else if (contentCss === false || editor.inline) {
            return [];
        }
        else {
            return ["default"];
        }
    }

    __getBodySetting(editor, name, defaultValue) {
        let value = editor.getParam(name, defaultValue);

        if (value.indexOf('=') !== -1) {
            let bodyObj = editor.getParam(name, '', "hash");
            return bodyObj.hasOwnProperty(editor.id) ? bodyObj[editor.id] : defaultValue;
        }
        else {
            return value;
        }
    }
}