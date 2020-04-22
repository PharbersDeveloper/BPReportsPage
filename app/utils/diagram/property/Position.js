class Position {
    constructor(x, y) {
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
    }
    remove(x, y) {
        this.x = x;
        this.y = y;
    }
    getPosition() {
        return {
            x: this.x,
            y: this.y
        };
    }
}
export default Position;