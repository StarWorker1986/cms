const matchMediaQuery = (query) => {
    return "matchMedia" in window ? matchMedia(query).matches : false;
}

let nav = navigator, userAgent = nav.userAgent;
let opera, webkit, ie, ie11, ie12, gecko, mac, iDevice, android, fileApi, phone, tablet, windowsPhone;

opera = false;
android = /Android/.test(userAgent);
webkit = /WebKit/.test(userAgent);
ie = !webkit && !opera && /MSIE/gi.test(userAgent) && /Explorer/gi.test(nav.appName);
ie = ie && /MSIE (\w+)\./.exec(userAgent)[1];
ie11 = userAgent.indexOf("Trident/") !== -1 && (userAgent.indexOf("rv:") !== -1 || nav.appName.indexOf("Netscape") !== -1) ? 11 : false;
ie12 = userAgent.indexOf("Edge/") !== -1 && !ie && !ie11 ? 12 : false;
ie = ie || ie11 || ie12;
gecko = !webkit && !ie11 && /Gecko/.test(userAgent);
mac = userAgent.indexOf("Mac") !== -1;
iDevice = /(iPad|iPhone)/.test(userAgent);
fileApi = "FormData" in window && "FileReader" in window && "URL" in window && !!URL.createObjectURL;
phone = matchMediaQuery("only screen and (max-device-width: 480px)") && (android || iDevice);
tablet = matchMediaQuery("only screen and (min-width: 800px)") && (android || iDevice);
windowsPhone = userAgent.indexOf("Windows Phone") !== -1;

ie12 && (webkit = false);

let contentEditable = !iDevice || fileApi || parseInt(userAgent.match(/AppleWebKit\/(\d*)/)[1], 10) >= 534;

export default class Env {
    static get opera() { return opera; }
    static get webkit() { return webkit; }
    static get ie() { return ie; }
    static get gecko() { return gecko; }
    static get mac() { return mac; }
    static get iOS() { return iDevice; }
    static get android() { return android; }
    static get contentEditable() { return contentEditable; }
    static get caretAfter() { return ie !== 8; }

    static get transparentSrc() {
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }

    static get range() {
        return window.getSelection && "Range" in window;
    }

    static get documentMode() {
        return ie && !ie12 ? document.documentMode || 7 : 10;
    }

    static get touchAble() {
        return ("ontouchstart" in document.documentElement);
    }

    static get fileApi() { return fileApi; }
    static get ceFalse() { return ie === false || ie > 8; }
    static get cacheSuffix() { return null; }
    static get container() { return null; }
    static get overrideViewPort() { return null; }
    static get experimentalShadowDom() { return false; }
    static get canHaveCSP() { return ie === false || ie > 11; }
    static get desktop() { return !phone && !tablet; }
    static get windowsPhone() { return windowsPhone; }
}