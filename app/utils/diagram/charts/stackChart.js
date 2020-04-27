import Histogram from './Histogram';
import { getAxisSide } from '../scale/axisTransform';
import { event, clientPoint } from 'd3-selection';
// import {animationType} from '../animation/animation';
import { stack, stackOrderNone, stackOffsetNone } from 'd3-shape';
import { max } from 'd3-array';
// import StateMachine from 'javascript-state-machine';
import D3Tooltip from '../tooltip/Tooltip';
import { formatLocale, format } from 'd3-format';
import D3Legend from '../legend/Legend';

class StackChart extends Histogram {
    constructor(opt) {
        super(opt);
        this.fsm = null;
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
        super.draw(selection);
        // selection are chart container
        let grid = this.grid;
        let svg = selection.append('svg')
            .attr('width', grid.width)
            .attr('height', grid.height);
        // this.scale(svg);
        // 画 bar
        // this.drawStack(svg);
        this.tooltip = new D3Tooltip(selection, 'b-tooltip');
        async function flow() {
            await this.requeryData(this.updateData);
            // await this.queryData()
            this.scale(svg);
            // 画 bar
            this.drawStack(svg);
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
    formatLegendData(data) {
        let { property: p } = this, colors = p.colorPool;
        let dealData = Object.keys(data[0]).slice(1);
        return dealData.reduce((acc, cur, i) => {
            acc.push({
                color: colors[i].HEX(), type: 'rect', label: cur, value: ''
            });
            return acc;
        }, []);
    }
    async requeryData(fn) {
        let { fsm, dimensions, option } = this, data = null;
        data = await fn.call(this, fsm, dimensions, option.fetch);
        this.data.dataset = data;
        this.dataset = this.parseData(data);
    }
    testInteraction(svg) {
        let self = this, { fsm, selection, dimensions } = this;
        svg.selectAll('rect').on('click', function (d) {
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
                    fsm[item] = d.data[item] || fsm[item];
                });
            }
            // 修改坐标轴的 dimension 
            self.xAxis.dimension = fsm.state;
            self.updateChart(selection);
        });
    }
    scale(svg) {
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
    // TODO 应该有一个 private 的parseData ,执行public parseData 返回的数据,用于
    // 做进一步的处理,例如此堆叠图中的 parseData 应该为 private parseData
    parseData(data) {
        const stackIns = stack()
            .keys(Object.keys(data[0]).slice(1))
            .order(stackOrderNone)
            .offset(stackOffsetNone);
        return stackIns(data);
    }
    drawStack(svg) {
        let xScale = this.xAxisBuilder.getScale();
        let { property: p } = this;
        let yScale = this.yAxisBuilder.getScale();
        let barWidth = 16;
        // const t = animationType();
        const series = this.dataset;
        svg.selectAll('g.stack')
            .data(series)
            .join(enter => enter.append('g'), update => update, exit => exit.remove())
            .classed('stack', true)
            .attr('fill', (_d, i) => p.colorPool[i].HEX())
            .attr('transform', `translate(${barWidth / 2 * -1},0)`)
            .selectAll('rect')
            .data(d => d)
            .join(enter => enter.append('rect'), update => update, exit => exit.remove())
            .attr('x', (d) => {
                // return xScale(new Date(d.data[this.xAxis.dimension]))
                return xScale(d.data[this.xAxis.dimension]) + xScale.bandwidth() / 2;
            })
            .attr('y', (d) => yScale(d[1]))
            .attr('height', (d) => yScale(d[0]) - yScale(d[1]))
            .attr('width', barWidth);
    }
    calcYaxisData() {
        const data = this.dataset;
        this.yAxis = Object.assign(Object.assign({}, this.yAxis), {
            max: max(data, (d) => max(d, (di) => di[1])),
        });
    }
    calcXaxisData() {
        let longestXData = this.dataset.reduce((acc, cur) => {
            if (cur.length >= acc.length) {
                acc = cur
            }
            return acc
        }, []);
        this.xAxis = Object.assign(Object.assign({}, this.xAxis), {
            data: longestXData.map(item => item.data[this.fsm.state]),
        });
    }
    mouseAction(svg) {
        let { grid, property: p, dataset, tooltip,fsm } = this,
            curDimensions = [this.xAxis.dimension, this.yAxis.dimension],
            { pl, pr } = grid.padding,
            yAxisWidth = getAxisSide(svg.select(`.${this.yAxis.className}`)),
            leftBlank = pl + yAxisWidth;

            dataset = this.data.dataset;
        svg.on('mousemove', function () {
            let eachSpackWidth = (grid.width - leftBlank - pr) / dataset.length,
                arr = dataset.map((_item, i) => i * eachSpackWidth),
                curPoint = event.offsetX - leftBlank,
                count = arr.findIndex((item, i) => item <= curPoint && arr[i + 1] >= curPoint);
            
                count = count < 0 && curPoint>0 ? dataset.length - 1 : count;

            let curData = dataset[Math.round(count)],
                point = clientPoint(this, event),
                // 可自定义 legend 通过此方式
                preLegend = {
                    content(data, dimensions,fsm) {
                        let prods = Object.keys(data);

                        prods.splice(prods.indexOf(fsm['state']),1);
                        let total = prods.reduce((acc,cur)=> {
                            return acc + data[cur];
                        },0)
                        let prodsTooltip = prods.map( prod => `<p>${prod} 销售额 ${formatLocale("thousands").format("~s")(data[prod])}</p>`).join(" ")
                        return `<p>${data[fsm['state']]} </p>
                                <p><span>总体市场规模</span> <span>${formatLocale("thousands").format("~s")(total)}</span></p>
                                ${prodsTooltip}`;
                    }
                }
                p.setLegendContent(p.getLegendContent() || preLegend.content)

            // p.legend = Object.assign(preLegend, p.legend);
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
export default StackChart;
