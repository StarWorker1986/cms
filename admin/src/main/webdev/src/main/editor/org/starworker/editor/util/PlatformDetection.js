import Strings from "./Strings";
import ArrUtils from "./ArrUtils";

class Version {
    static nu(major, minor) {
        return { major: major, minor: minor };
    }

    static detect(versionRegexes, agent) {
        let cleanedAgent = String(agent).toLowerCase();

        if (versionRegexes.length === 0) {
            return unknown();
        }
        return this.__find(versionRegexes, cleanedAgent);
    }

    static unknown() {
        return this.nu(0, 0);
    }

    static __firstMatch(regexes, s) {
        for (let i = 0; i < regexes.length; i++) {
            let x = regexes[i];
            if (x.test(s)) {
                return x;
            }
        }
        return undefined;
    }

    static __find(regexes, agent) {
        let r = this.__firstMatch(regexes, agent);
        if (!r) {
            return { major: 0, minor: 0 };
        }
        let group = (i) => {
            return Number(agent.replace(r, "$" + i));
        };
        return this.nu(group(1), group(2));
    }
}

class Browser {
    static nu(info) {
        let current = info.current, version = info.version;

        return {
            current: current,
            version: version,
            isEdge: this.__isBrowser(this.edge, current),
            isChrome: this.__isBrowser(this.chrome, current),
            isIE: this.__isBrowser(this.ie, current),
            isOpera: this.__isBrowser(this.opera, current),
            isFirefox: this.__isBrowser(this.firefox, current),
            isSafari: this.__isBrowser(this.safari, current)
        };
    }

    static unknown() {
        return nu({
            current: undefined,
            version: Version.unknown()
        });
    }

    static get edge() {
        return "Edge";
    }

    static get chrome() {
        return "Chrome";
    }

    static get ie() {
        return "IE";
    }

    static get opera() {
        return "Opera";
    }

    static get firefox() {
        return "Firefox";
    }

    static get safari() {
        return "Safari";
    }

    static get browsers() {
        let normalVersionRegex = /.*?version\/\ ?([0-9]+)\.([0-9]+).*/;

        return [
            {
                name: "Edge",
                versionRegexes: [/.*?edge\/ ?([0-9]+)\.([0-9]+)$/],
                search: function (uastring) {
                    return Strings.contains(uastring, "edge/") && Strings.contains(uastring, "chrome") && j.contains(uastring, "safari") && Strings.contains(uastring, "applewebkit");
                }
            },
            {
                name: "Chrome",
                versionRegexes: [/.*?chrome\/([0-9]+)\.([0-9]+).*/, normalVersionRegex],
                search: function (uastring) {
                    return Strings.contains(uastring, "chrome") && !Strings.contains(uastring, "chromeframe");
                }
            },
            {
                name: "IE",
                versionRegexes: [/.*?msie\ ?([0-9]+)\.([0-9]+).*/, /.*?rv:([0-9]+)\.([0-9]+).*/],
                search: function (uastring) {
                    return Strings.contains(uastring, "msie") || Strings.contains(uastring, "trident");
                }
            },
            {
                name: "Opera",
                versionRegexes: [normalVersionRegex, /.*?opera\/([0-9]+)\.([0-9]+).*/],
                search: this.__checkContains("opera")
            },
            {
                name: "Firefox",
                versionRegexes: [/.*?firefox\/\ ?([0-9]+)\.([0-9]+).*/],
                search: this.__checkContains("firefox")
            },
            {
                name: "Safari",
                versionRegexes: [normalVersionRegex, /.*?cpu os ([0-9]+)_([0-9]+).*/],
                search: function (uastring) {
                    return (Strings.contains(uastring, "safari") || Strings.contains(uastring, "mobile/")) && Strings.contains(uastring, "applewebkit");
                }
            }
        ];
    }

    static get oses() {
        return [
            {
                name: "Windows",
                search: this.__checkContains("win"),
                versionRegexes: [/.*?windows\ nt\ ?([0-9]+)\.([0-9]+).*/]
            },
            {
                name: "iOS",
                search: function (uastring) {
                    return Strings.contains(uastring, "iphone") || Strings.contains(uastring, "ipad");
                },
                versionRegexes: [/.*?version\/\ ?([0-9]+)\.([0-9]+).*/, /.*cpu os ([0-9]+)_([0-9]+).*/, /.*cpu iphone os ([0-9]+)_([0-9]+).*/]
            },
            {
                name: "Android",
                search: this.__checkContains("android"),
                versionRegexes: [/.*?android\ ?([0-9]+)\.([0-9]+).*/]
            },
            {
                name: "OSX",
                search: this.__checkContains("os x"),
                versionRegexes: [/.*?os\ x\ ?([0-9]+)_([0-9]+).*/]
            },
            {
                name: "Linux",
                search: this.__checkContains("linux"),
                versionRegexes: []
            },
            {
                name: "Solaris",
                search: this.__checkContains("sunos"),
                versionRegexes: []
            },
            {
                name: "FreeBSD",
                search: this.__checkContains("freebsd"),
                versionRegexes: []
            }
        ];
    }

    static __isBrowser(name, current) {
        return () => {
            return current === name;
        };
    }

    static __checkContains(target) {
        return (uastring) => {
            return Strings.contains(uastring, target);
        };
    }
}

class DiviceType {
    constructor(os, browser, userAgent) {
        this.isiPad = os.isiOS() && /ipad/i.test(userAgent) === true;
        this.isiPhone = os.isiOS() && !this.isiPad;
        this.isAndroid3 = os.isAndroid() && os.version.major === 3;
        this.isAndroid4 = os.isAndroid() && os.version.major === 4;
        this.isTablet = this.isiPad || this.isAndroid3 || (this.isAndroid4 && /mobile/i.test(userAgent) === true);
        this.isTouch = os.isiOS() || os.isAndroid();
        this.isPhone = this.isTouch && !this.isTablet;
        this.iOSwebview = browser.isSafari() && os.isiOS() && /safari/i.test(userAgent) === false;
    }
}

class OperatingSystem {
    static unknown() {
        return nu({
            current: undefined,
            version: Version.unknown()
        });
    }

    static nu(info) {
        let current = info.current, version = info.version;

        return {
            current: current,
            version: version,
            isWindows: this.__isOS(this.windows, current),
            isiOS: this.__isOS(this.ios, current),
            isAndroid: this.__isOS(this.android, current),
            isOSX: this.__isOS(this.osx, current),
            isLinux: this.__isOS(this.linux, current),
            isSolaris: this.__isOS(this.solaris, current),
            isFreeBSD: this.__isOS(this.freebsd, current)
        };
    }

    static get windows() {
        return "Windows";
    }

    static get ios() {
        return "iOS";
    }

    static get android() {
        return "Android";
    }

    static get linux() {
        return "Linux";
    }

    static get osx() {
        return "OSX";
    }

    static get solaris() {
        return "Solaris";
    }

    static get freebsd() {
        return "FreeBSD";
    }

    static __isOS(name, current) {
        return () => {
            return current === name;
        };
    }
}

class UaString {
    static detectBrowser(browsers, userAgent) {
        return this.__detect(browsers, userAgent).map((browser) => {
            let version = Version.detect(browser.versionRegexes, userAgent);
            return {
                current: browser.name,
                version: version
            };
        });
    }

    static detectOs(oses, userAgent) {
        return this.__detect(oses, userAgent).map((os) => {
            let version = Version.detect(os.versionRegexes, userAgent);
            return {
                current: os.name,
                version: version
            };
        });
    }

    static __detect(candidates, userAgent) {
        let agent = String(userAgent).toLowerCase();
        return Tools.find(candidates, (candidate) => {
            return candidate.search(agent);
        });
    }
}

export default class PlatformDetection {
    static get detect() {
        return Tools.cached(() => {
            return this.__detect(navigator.userAgent);
        });
    }

    static __detect(userAgent) {
        let browsers = Browser.browsers, oses = Browser.oses;

        let browser = UaString.detectBrowser(browsers, userAgent).fold(Browser.unknown, (agent) => Browser.nu(agent)),
            os = UaString.detectOs(oses, userAgent).fold(OperatingSystem.unknown, (agent) => OperatingSystem.nu(agent)),
            deviceType = new DiviceType(os, browser, userAgent);
        
        return {
            browser: browser,
            os: os,
            deviceType: deviceType
        };
    }
}