export default class Uuid {
    static uuid(prefix) {
        return prefix + (Uuid.count++) + this.__seed();
    }

    static __seed() {
        let rnd = () => Math.round(Math.random() * 0xFFFFFFFF).toString(36), now = new Date().getTime();
        return 's' + now.toString(36) + rnd() + rnd() + rnd();
    }
}
Uuid.count = 0;
