import { scaleLinear, scaleBand, scaleTime, scaleLog } from 'd3-scale';
import { axisLeft, axisRight, axisBottom, axisTop } from 'd3-axis';
const DEFAULT = {
    show: true,
    className: '',
    girdIndex: 0,
    position: 'bottom',
    offset: 0,
    // legend（如果是底部）的和。
    // 当先生成 y 轴的时候，offset 可以为 0，会自动计算 y 轴宽度。
    // x 轴的偏移量最好是动态计算 y 轴的宽度。
    type: 'value',
    // 'value' 数值轴，适用于连续数据。 default
    // 'category' 类目轴，适用于离散的类目数据，为该类型时必须通过 data 设置类目数据。
    // 'time' 时间轴，适用于连续的时序数据，与数值轴相比时间轴带有时间的格式化，在刻度计算上也有所不同，例如会根据跨度的范围来决定使用月，星期，日还是小时范围的刻度。
    // 'log' 对数轴。适用于对数数据。
    name: "",
    nameLocation: "end",
    min: 0,
    max: 0,
    data: null,
    splitNumber: 5,
    ticks: [5],
    formatter: null,
    edgeWidth: 0
};
class AxisBuilder {
    // axis options
    constructor(opt = DEFAULT, grid) {
        this.defaultGrid = {
            padding: {
                pt: 24,
                pr: 24,
                pb: 24,
                pl: 24,
            },
            width: 200,
            height: 200
        };
        this.opt = Object.assign(Object.assign({}, DEFAULT), opt);
        this.grid = Object.assign(Object.assign({}, this.defaultGrid), grid);
        this.scale = this.rangeScale(this.opt);
    }
    createAxis(scale, option) {
        this.opt = option;
        this.setScaleDomain(scale, option);
        this.axis = this.directionAxis(scale, option.position);
        this.formatAxis();
        // svg.append('g')
        //     .classed(this.opt.className, true)
        //     .call(this.axis);
        // this.axisWidth = getAxisSide(svg.select('.y-axis'));
        // TODO 移动应该放到 x 轴也生成之后执行
        // svg.select(".y-axis")
        //     .attr("transform", `translate(${grid.padding.pl + this.axisWidth},0)`);
        // this.axisTransform(this.opt.position, grid)
    }
    formatAxis() {
        let axis = this.getAxis(), option = this.opt, count = option.ticks || 10, formatter = option.formatter;
        // https://github.com/xswei/d3-format#locale_format
        if (!formatter) {
            axis.ticks(count);
        }
        else if (typeof formatter === 'string') {
            axis.ticks(count, formatter);
        }
        else if (typeof formatter === 'function') {
            axis.ticks(count)
                .tickFormat(formatter);
        }
    }
    rangeScale(option) {
        let { type } = option, scaleType = null;
        switch (type) {
            case 'category':
                scaleType = scaleBand();
                break;
            case 'time':
                scaleType = scaleTime();
                break;
            case 'log':
                scaleType = scaleLog();
                break;
            case 'value':
            default:
                // 数值轴，适用于连续数据
                scaleType = scaleLinear();
                break;
        }
        return scaleType;
        // TODO max & min 可以自行计算
        // .domain([min, max])
        // .range(range);
    }
    setScaleDomain(scale, option) {
        let range = [0, 0], { padding, width, height } = this.grid, 
            { offset, edgeWidth = 0, position, type, min, max, data } = option, 
            domain = [min, max];

        console.log(padding)
        switch (position) {
            case 'bottom':
            case 'top':
                range = [padding.pl + offset + edgeWidth, width - padding.pr];
                break;
            case 'right':
            case 'left':
            default:
                range = [height - padding.pt - offset - edgeWidth, padding.pb];
        }
        console.log(range)
        switch (type) {
            case 'category':
                scale = scale
                    .domain(data)
                    .range(range);
                break;
            case 'log':
                scale = scaleLog();
                break;
            case 'value':
            case 'time':
            default:
                // 数值轴，适用于连续数据
                scale = scale
                    // TODO max & min 可以自行计算
                    .domain(domain)
                    .range(range);
                break;
        }
        return scale;
    }
    directionAxis(scale, direction) {
        let axis;
        // let { formatter } = this.opt;
        // if (formatter instanceof Function) {
        //     formatter = formatter()
        // }
        switch (direction) {
            case 'right':
                axis = axisRight(scale);
                break;
            case 'bottom':
                axis = axisBottom(scale);
                break;
            case 'top':
                axis = axisTop(scale);
                break;
            case 'left':
            default:
                axis = axisLeft(scale);
                break;
        }
        return axis;
    }
    getScale() {
        return this.scale;
    }
    getAxis() {
        return this.axis;
    }
    axisTransform(position, edgeWidth, grid) {
        let distance = [0, 0],
            { padding, height, width } = grid;
            
        switch (position) {
            case 'bottom':
                distance = [0, height - padding.pb - edgeWidth];
                break;
            case 'top':
                distance = [padding.pl, padding.pt];
                break;
            case 'right':
                distance = [width - padding.pr - edgeWidth, 0];
                break;
            case 'left':
                distance = [padding.pl + edgeWidth, 0];
                break;
            default:
                break;
        }
        return distance;
    }
}
export default AxisBuilder;