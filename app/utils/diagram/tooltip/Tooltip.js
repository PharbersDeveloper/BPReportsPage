import { isEmpty } from '@ember/utils';
class D3Tooltip {
    constructor(container, className = "") {
        this.isShow = false;
        this.content = "";
        this.position = [];
        this.gap = [24, 24];
        this.data = null;
        this.dimensions = [];
        this.fsm = null;
        this.container = container;
        const tooltip = container.append('div');
        let cn = this.getClass(className + ' bp-tooltip');
        tooltip.classed(cn, true);
        this.tooltip = tooltip;
        this.hidden();
        this.updatePosition([0, 0]);
    }
    show() {
        this.tooltip.classed('d-none', false)
            .style('display', 'block');
    }
    hidden() {
        this.tooltip.classed('d-none', true)
            .style('display', 'none');
    }
    remove() {
        this.hidden();
        this.container.select('.bp-tooltip').remove();
    }
    getClass(className) {
        let result = "";
        if (!className || className.length == 0) {
            return result;
        }
        switch (Object.prototype.toString.call(className)) {
            case '[object String]':
                result = className;
                break;
            case '[object Array]':
                result = className.join("");
                break;
            default:
                break;
        }
        // 需配合 bootstrap，如果没有 bootstrap ，需要设置class d-none 为 display：none 
        return result;
    }
    setCurData(data) {
        this.data = data;
        // const self = this;
        // const children = this.container.select('svg');
        // children.on('mousemove', this.throttle(function () {
        //     if (event) {
        //         let p = clientPoint(this, event);
        //         self.updatePosition(p)
        //         // TODO 可根据与四个边框的距离
        //         // 合理配置提示框在鼠标的方位
        //     }
        // }, 50, 100))
    }
    setCurDimensions(data) {
        this.dimensions = data;
    }
    setCurFsm(fsm) {
        this.fsm = fsm
    }
    setContent(fn) {
        let content = null;
        if(isEmpty(this.data)) {
            this.hidden();
            return;
        }
        if (typeof fn === 'function') {
            content = fn.call(null, this.data, this.dimensions, this.fsm);
        } else {
            content = fn
        }
        this.tooltip.html(content);
        this.tooltip
            .style("position", "absolute");
    }
    updatePosition(p) {
        this.position = p;
        const { container, tooltip } = this;
        let containerSize = [parseInt(container.style('width')),
        parseInt(container.style('height'))],
            tooltipSize = [parseInt(tooltip.style('width')),
            parseInt(tooltip.style('height'))],
            restWidthSpace = containerSize[0] / 2,
            restHeightSpace = containerSize[1] / 2,
            resultPosition = [p[0], p[1]];

        switch (true) {
            case p[0] > restWidthSpace:
                resultPosition[0] = p[0] - tooltipSize[0] - this.gap[0];
                // this.moveTo(p[0]-tooltipSize[0]-this.gap[0],p[1]+this.gap[1])
                break;
            case p[0] <= restWidthSpace:
                resultPosition[0] = p[0] + this.gap[0];
                // resultPosition[1] = p[1] + this.gap[1];
                // this.moveTo(p[0] + this.gap[0], p[1] + this.gap[1])
                break;
            default:
                break;
        }
        switch (true) {
            case p[1] > restHeightSpace:
                resultPosition[1] = p[1] - tooltipSize[1] - this.gap[1];
                break;
            case p[1] <= restHeightSpace:
                resultPosition[1] = p[1] + this.gap[1];
                break;
            default:
                break;
        }
        this.moveTo(resultPosition[0] < 0 ? 0 : resultPosition[0], resultPosition[1]);
    }
    moveTo(x, y) {
        this.tooltip
            .transition()
            .duration(300)
            .style('left', `${x}px`)
            .style('top', `${y}px`);
    }
    getContainer() {
        return this.container;
    }
    getTooltip() {
        return this.tooltip;
    }
    throttle(fn, delay, mustRunDelay) {
        let timer = null;
        let t_start = 0;
        return function () {
            const context = this, args = [...arguments], t_curr = +new Date();
            clearTimeout(timer);
            if (!t_start) {
                t_start = t_curr;
            }
            if (t_curr - t_start >= mustRunDelay) {
                fn.apply(context, args);
                t_start = t_curr;
            }
            else {
                timer = setTimeout(function () {
                    fn.apply(context, args);
                }, delay);
            }
        };
    }
}
export default D3Tooltip;
