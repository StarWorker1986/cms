export default class EnvUtils {
	static touchAble() {
       return ("ontouchstart" in document.documentElement);
    }
}