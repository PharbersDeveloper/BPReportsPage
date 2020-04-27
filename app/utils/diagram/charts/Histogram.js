import { Color, DataAdapter, DataSource, HistogramProperty, Position, Rotation, Size, } from '../index';
import AxisBuilder from '../scale/AxisBuilder';
import { max } from 'd3-array';
import { getAxisSide } from '../scale/axisTransform';
import { transition } from 'd3-transition';

class Histogram {
    constructor(opt) {
        // 通过 opt 对象，初始化 Histogram
        var _a, _b, _c;
        this.data = new DataSource();
        this.dataset = [];
        this.adapter = new DataAdapter();
        this.xAxis = null; // TODO interface Axis
        this.yAxis = null;
        this.pieAxis = null;
        this.dimensions = [];
        // TODO 更好的方式?
        this.grid = null; // 将 grid 单独从 option 中抽离出来
        this.geo = null;
        this.polar = null;
        this.defaultOpt = {
            id: '',
            dataset: [],
            dimension: [],
            dimensions: [],
            fetch: {},
            measures: [],
            xAxis: {},
            yAxis: {},
            pieAxis: {},
            grid: {},
            geo: {},
            polar: {},
            position: {
                x: 0,
                y: 0
            },
            rotate: {
                degree: 0
            },
            colorPool: [],
            legend: null
        };
        this.option = null;
        // 
        this.updateData = function () { };
        // tooltip instance
        this.tooltip = undefined;
        let option = this.defaultOpt;
        for (let item in option) {
            if (option.hasOwnProperty(item)) {
                option[item] = opt[item] || option[item];
            }
        }
        this.option = option;
        // opt = {...this.defaultOpt,...opt}
        this.xAxis = option.xAxis;
        this.yAxis = option.yAxis;
        this.pieAxis = option.pieAxis;
        this.geo = option.geo;
        this.polar = option.polar;
        this.dimensions = option.dimensions;
        // init DataSource
        this.data = new DataSource();
        this.data.dataset = option.dataset;
        this.data.dimension = option.dimension;
        // init DataAdapter
        this.adapter = new DataAdapter();
        // init HistogramProperty
        this.property = new HistogramProperty();
        this.property.hitSize = new Size(option.grid.width, option.grid.height);
        this.property.hitSize.setPadding(option.grid.padding);
        this.property.relativePos = new Position(option.position.x, option.position.y);
        this.property.rotate = new Rotation(option.rotate.degree);
        this.property.colorPool = option.colorPool.map((color) => new Color(color));
        this.property.legend = option.legend || {}
        this.grid = {
            padding: (_a = this.property.hitSize) === null || _a === void 0 ? void 0 : _a.getPadding(),
            width: (_b = this.property.hitSize) === null || _b === void 0 ? void 0 : _b.getWidth(),
            height: (_c = this.property.hitSize) === null || _c === void 0 ? void 0 : _c.getHeight(),
            bgColor: new Color(option.grid.bgColor || 'transparent')
        };
    }
    draw(selection) {
        this.selection = selection;
        this.resetSize(selection);
    }
    removeSvg() {
        this.selection.select('svg').remove()
        this.selection.select('div').remove()
    }
    resetSize(selection) {
        let grid = this.grid;
        let preSetWidth = parseFloat(grid.width);
        let preSetHeight = parseFloat(grid.height);
        if (isNaN(preSetWidth)) {
            let sWidth = parseFloat(selection.style('width'));
            this.property.hitSize.setWidth(sWidth);
            this.grid = Object.assign(Object.assign({}, this.grid), { width: sWidth });
        }
        if (isNaN(preSetHeight)) {
            let sHeight = parseFloat(selection.style('height'));
            this.property.hitSize.setHeight(sHeight);
            this.grid = Object.assign(Object.assign({}, this.grid), { height: sHeight });
        }
    }
    scale(svg) {}
    parseData(originData) {
        return this.adapter.parse(originData);
    }
    drawScale(axisOpt, grid) {
        const axisBuilderIns = new AxisBuilder(axisOpt, grid);
        axisBuilderIns.createAxis(axisBuilderIns.getScale(), axisOpt);
        return axisBuilderIns;
    }
    drawYaxis(svg) {
        this.calcYaxisData();
        let yAxisBuilderIns = this.drawScale(this.yAxis, this.grid);
        // let yScale = yAxisIns.getScale();
        this.yAxisBuilder = yAxisBuilderIns;
        svg.append('g')
            .classed(this.yAxis.className, true)
            // .attr("transform", `translate(${yAxismove[0]},${yAxismove[1]})`)
            .call(yAxisBuilderIns.getAxis());
        return yAxisBuilderIns;
    }
    // 在 update*axis 方法之后以及之前执行
    resetOffset(opt, edgeWidth) {
        // let { offset } = opt
        opt.edgeWidth = edgeWidth;
        // opt.offset = offset && offset !== edgeWidth ? offset + edgeWidth : edgeWidth
    }
    // 每个更新需要执行两次?
    updateYaxis(yAxisBuilderIns, svg) {
        let scale = yAxisBuilderIns.getScale();
        let opt = this.yAxis;
        yAxisBuilderIns.createAxis(scale, opt);
        const axisSelection = svg.select(`.${opt.className}`);
        let yAxisWidth = getAxisSide(axisSelection);
        let yAxismove = yAxisBuilderIns.axisTransform(opt.position, yAxisWidth, this.grid);
        axisSelection
            .attr('transform', `translate(${yAxismove[0]},${yAxismove[1]})`)
            .call(yAxisBuilderIns.getAxis());
    }
    updateXaxis(xAxisBuilderIns, svg) {
        let scale = xAxisBuilderIns.getScale();
        let opt = this.xAxis;
        xAxisBuilderIns.createAxis(scale, opt);
        const axisSelection = svg.select(`.${opt.className}`);
        let xAxisHeight = getAxisSide(axisSelection, 'height');
        let xAxismove = xAxisBuilderIns.axisTransform(opt.position, xAxisHeight, this.grid);
        axisSelection
            .attr('transform', `translate(${xAxismove[0]},${xAxismove[1]})`)
            .call(xAxisBuilderIns.getAxis());
    }
    drawXaxis(svg) {
        // const dataset = this.dataset;
        // const flatDataset = flatDeep(this.dataset);
        // this.xAxis = {
        //     ...this.xAxis, ...{
        //         data: flatDataset.map(datum => datum[this.xAxis.dimension]),
        //     }
        // }
        this.calcXaxisData();
        let xAxisBuilderIns = this.drawScale(this.xAxis, this.grid);
        this.xAxisBuilder = xAxisBuilderIns;
        svg.append('g')
            .classed(this.xAxis.className, true)
            .call(xAxisBuilderIns.getAxis());
        return xAxisBuilderIns;
    }
    // 这个需要根据 x 轴 / y 轴展示的数据进行修改
    calcXaxisData() {
        // default xAxis type category
        this.xAxis = Object.assign(Object.assign({}, this.xAxis), {
            data: this.dataset.map(datum => datum[this.xAxis.dimension]),
        });
    }
    calcYaxisData() {
        const dataset = this.dataset;
        this.yAxis = Object.assign(Object.assign({}, this.yAxis), {
            max: max(dataset.map(datum => datum[this.yAxis.dimension])),
        });
    }
    transition() {
        return transition()
            .ease();
    }
    // 更新图表的操作
    updateChart(selection) {
        var _a;
        selection.select('svg').remove();
        (_a = this.tooltip) === null || _a === void 0 ? void 0 : _a.remove();
        this.draw(selection);
    }
}
export default Histogram;