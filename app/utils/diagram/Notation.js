import Color from './property/Color';
import Text from './Text';

class Notation {
    constructor() {
        this.content = new Text("some");
        this.color = new Color('black');
    }
}
export default Notation;