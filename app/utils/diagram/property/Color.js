import { color } from 'd3-color';

class Color {
    constructor(colorArr) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.opacity = 1;
        this.hex = '';
        if (typeof colorArr === 'string') {
            this.colorObj = color(colorArr);
        }
        else {
            this.r = colorArr[0];
            this.g = colorArr[1];
            this.b = colorArr[2];
            this.opacity = colorArr[3] ? colorArr[3] : 1;
            this.colorObj = (color(`rgb(${this.r},${this.g},${this.b})`));
            this.colorObj.opacity = this.opacity;
        }
        this.hex = this.colorObj.hex();
        this.rgb = this.colorObj.toString();
    }
    RGB() {
        return this.rgb;
    }
    HEX() {
        return this.hex;
    }
}
export default Color;