import Histogram from './Histogram';
import { event, clientPoint } from 'd3-selection';
import { getAxisSide } from '../scale/axisTransform';
import { flatDeep } from '../data/FlatDeep';
import { animationType, tweenDash } from '../animation/animation';
import { max, min } from 'd3-array';
import { line, curveCatmullRom } from 'd3-shape';
// import StateMachine from 'javascript-state-machine';
import D3Tooltip from '../tooltip/Tooltip';
import { formatLocale, format } from 'd3-format';
import D3Legend from '../legend/Legend';

class LineChart extends Histogram {
    constructor(opt) {
        super(opt);
        this.fsm = null;
        this.selection = null;
        // 格式化数据 -> 修改为在 queryData 之后格式化 
        // this.dataset = this.parseData(this.data.dataset);
        let dimensions = this.dimensions, initFsmData = dimensions.reduce((acc, cur) => {
            acc[cur] = '';
            return acc;
        }, {}), transitions = dimensions.map((d, i, arr) => {
            if (i + 1 !== dimensions.length) {
                return { name: 'drilldown', from: d, to: arr[i + 1] };
            }
            return { name: 'rollup', from: d, to: arr[0] };
        });
        this.fsm = new StateMachine({
            init: dimensions[0],
            data: initFsmData,
            transitions
        });
    }
    draw(selection) {
        // selection are chart container
        super.draw(selection);
        let grid = this.grid;
        let svg = selection.append('svg')
            .attr('width', grid.width)
            .attr('height', grid.height);
        // this.scale(svg);
        // this.drawLines(svg)
        this.tooltip = new D3Tooltip(selection, 'b-tooltip');
        async function flow() {
            await this.requeryData(this.updateData);
            // await this.queryData()
            this.scale(svg);
            // 画 lines
            this.drawLines(svg);
            // 有了原始数据后,画legend
            let legendData = this.formatLegendData(this.data.dataset);
            this.legend = new D3Legend(svg, legendData);
            this.legend.draw();
            // 添加交互
            this.mouseAction(svg);
            // 测试交互
            this.testInteraction(svg);
        }
        flow.call(this);
    }
    async requeryData(fn) {
        let { fsm, dimensions, option } = this,
            data = null;

        data = await fn.call(this, fsm, dimensions, option.fetch);
        this.data.dataset = data;
        this.dataset = this.parseData(data);
    }

    formatLegendData(data) {
        let { property: p } = this,
            colors = p.colorPool,
            dealData = data.map(item => item[0]['legendLable']);
        return dealData.reduce((acc, cur, i) => {
            acc.push({
                color: colors[i].HEX(), type: 'rect', label: cur, value: ''
            });
            return acc;
        }, []);
    }
    testInteraction(svg) {
        let self = this, { fsm, selection, dimensions } = this;
        svg.selectAll('circle').on('click', function (d) {
            // 修改 fsm 的 data-以便获取数据的时候可以得知维度信息
            if (fsm.state === dimensions[dimensions.length - 1]) {
                // 如果是最后一个维度,则进行清空
                dimensions.forEach((item) => {
                    fsm[item] = '';
                });
                fsm.rollup();
            }
            else {
                fsm.drilldown();
                dimensions.forEach((item) => {
                    fsm[item] = d[item] || fsm[item];
                });
            }
            // 修改坐标轴的 dimension 
            self.xAxis.dimension = fsm.state;
            self.updateChart(selection);
        });
    }
    scale(svg = null) {
        // 画轴
        const yAxisIns = this.drawYaxis(svg);
        const xAxisIns = this.drawXaxis(svg);
        // 计算 x 轴 / y 轴的 高度/宽度,分别作为 offset 复制给 yOpt / xOpt
        let yAxisWidth = getAxisSide(svg.select(`.${this.yAxis.className}`));
        let xAxisHeight = getAxisSide(svg.select(`.${this.xAxis.className}`), 'height');
        this.resetOffset(this.xAxis, yAxisWidth);
        this.resetOffset(this.yAxis, xAxisHeight);
        this.updateYaxis(yAxisIns, svg);
        this.updateXaxis(xAxisIns, svg);
    }
    drawLines(svg = null) {
        let xScale = this.xAxisBuilder.getScale(),
            { xAxis, yAxis, property: p } = this,
            yScale = (this.yAxisBuilder).getScale();

        const lineLayout = line()
            .x(d => xScale(d[xAxis.dimension]))
            .y(d => yScale(d[yAxis.dimension]))
            // 添加弯曲度
            // https://bl.ocks.org/d3noob/ced1b9b18bd8192d2c898884033b5529
            // 上述链接展示参数的不同，线条会有怎样的变化
            .curve(curveCatmullRom.alpha(0.5));
        this.dataset.forEach((data, index) => {
            svg.append("path")
                .datum(data)
                .classed('line-path', true)
                .attr('transform', `translate(${xScale.bandwidth() / 2},0)`)
                .attr("d", lineLayout)
                .attr('fill', 'none')
                .attr('stroke-width', 2)
                .attr('stroke', () => p.colorPool[index].HEX());
            // 添加初始动画
            const t = animationType();
            svg.select('.line-path')
                .transition(t)
                .duration(600)
                .attrTween("stroke-dasharray", tweenDash);
            let circles = svg.append('g')
                .selectAll('circle')
                .data(data)
                .enter();
            let combCirle = circles
                .append('g')
                .classed("comb-circle", true)
                .style("width", 10)
                .attr("height", 10)
                .attr("transform", (d) => `translate(${xScale(d[xAxis.dimension]) + xScale.bandwidth() / 2},${yScale(d[yAxis.dimension])})`);
            combCirle
                .append('circle')
                .classed("outer-circle", true)
                .attr('r', 3)
                .attr('stroke', () => p.colorPool[index].HEX())
                .attr('fill', 'white');
            combCirle
                .append('circle')
                .classed("inner-circle", true)
                .attr('r', 1)
                .attr('stroke', () => p.colorPool[index].HEX())
                .attr('fill', () => p.colorPool[index].HEX());
        });
    }
    // 这个需要根据 x 轴 / y 轴展示的数据进行修改
    calcXaxisData() {
        // default xAxis type category
        let longestXData = this.dataset.reduce((acc, cur) => {
            if (cur.length >= acc.length) {
                acc = cur
            }
            return acc
        }, []);

        this.xAxis = Object.assign(Object.assign({}, this.xAxis), {
            data: longestXData.map((datum) => datum[this.xAxis.dimension]),
        });
    }
    calcYaxisData() {
        const flatData = flatDeep(this.dataset);
        this.yAxis = Object.assign(Object.assign({}, this.yAxis), {
            max: max(flatData.map(datum => datum[this.yAxis.dimension])),
            min: typeof this.yAxis.min === 'string' ? min(flatData.map(datum => datum[this.yAxis.dimension])) : this.yAxis.min
        });
    }
    mouseAction(svg) {
        let { grid, property: p, dataset, tooltip, fsm } = this,
            curDimensions = [this.xAxis.dimension, this.yAxis.dimension],
            { pl, pr } = grid.padding,
            yAxisWidth = getAxisSide(svg.select(`.${this.yAxis.className}`)),
            leftBlank = pl + yAxisWidth;


        svg.on('mousemove', function () {
            let longestXData = dataset.reduce((acc, cur) => {
                if (cur.length >= acc.length) {
                    acc = cur
                }
                return acc
            }, []),
                eachSpackWidth = (grid.width - leftBlank - pr) / longestXData.length,
                arr = longestXData.map((_item, i) => i * eachSpackWidth),
                curPoint = event.offsetX - leftBlank - pr,
                count = arr.findIndex((item, i) => item <= curPoint && arr[i + 1] >= curPoint);

            count = count < 0 && curPoint > 0 ? longestXData.length - 1 : count;

            let longestDataCur = longestXData[Math.round(count)],
                longestDataCurKey = longestDataCur[fsm.state],
                curData = dataset.map(data => {
                    let cur = data.find(item => item[fsm.state] === longestDataCurKey);
                    return cur ? cur : null
                }),
                point = clientPoint(this, event),
                // 可自定义 legend 通过此方式
                preLegend = {
                    content(data, dimensions,jsm) {
                        return `<p>${data[0][jsm["state"]]}</p>
                        <p>产品增长率 ${format(".2%")(data.find(prod => prod.legendLable === "产品")[dimensions[1]])}</p>
                            <p>产品市场规模增长率 ${format(".2%")(data.find(prod => prod.legendLable === "市场")['FATHER_GEO_SALES_VALUE_GROWTH_RATE'])} </p>`;
                    }
                }
            p.setLegendContent(p.getLegendContent() || preLegend.content);

            tooltip === null || tooltip === void 0 ? void 0 : tooltip.updatePosition(point);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setCurData(curData);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setCurDimensions(curDimensions);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setCurFsm(fsm);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setContent(p.getLegendContent());
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.show();
        });
        svg.on('mouseout', function () {
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.hidden();
        });
    }
}
export default LineChart;
