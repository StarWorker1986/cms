export default class EnvUtil {
	static touchAble() {
       return ("ontouchstart" in document.documentElement);
    }
}