import Color from "./property/Color";
class Text {
    constructor(c) {
        this.content = '';
        this.front = 14;
        this.color = new Color('black');
        this.content = c;
    }
    placeHolderMethod() {
        return 'will do something';
    }
}
export default Text;