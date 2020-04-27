import { Size } from '../index';

class HistogramProterty {
    constructor() {
        this.hitSize = new Size(100, 100);
        this.relativePos = null;
        this.rotate = null;
        this.colorPool = [];
        this.legend = {
            content(){}
        };
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
    setLegendContent(content /** fn or string */) {
        this.legend.content = content;
    }
    getLegendContent()/** fn or string */ {
        return this.legend.content ? this.legend.content : null;
    }
}
export default HistogramProterty;