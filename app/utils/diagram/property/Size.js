class Size {
    constructor(w, h) {
        this.width = 100;
        this.height = 100;
        this.padding = {
            pt: 0,
            pr: 0,
            pb: 0,
            pl: 0
        };
        this.width = w;
        this.height = h;
    }
    setWidth(w) {
        this.width = w;
    }
    setHeight(h) {
        this.height = h;
    }
    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    getPadding() {
        return this.padding;
    }
    setPadding(padding = this.padding) {
        let { top: pt = 0, right: pr = 0, bottom: pb = 0, left: pl = 0 } = padding;
        this.padding = { pt, pr, pb, pl };
    }
    placeHolderMethod() {
        return 'do something';
    }
}
export default Size;
 