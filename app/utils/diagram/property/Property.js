import { Size } from '../index';
class HistogramProterty {
    constructor() {
        this.hitSize = new Size(100, 100);
        this.relativePos = null;
        this.rotate = null;
        this.colorPool = [];
    }
    setSize(x, y) {
        let size = new Size(x, y);
        this.hitSize = size;
    }
    resize() {
    }
    resetRotate() {
    }
    transform() {
    }
}
export default HistogramProterty;