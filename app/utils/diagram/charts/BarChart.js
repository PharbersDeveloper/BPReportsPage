import Histogram from './Histogram';
import { getAxisSide } from '../scale/axisTransform';
import { event, clientPoint } from 'd3-selection';
import { animationType } from '../animation/animation';
import D3Tooltip from '../tooltip/Tooltip';
import D3Legend from '../legend/Legend';
import { formatLocale, format } from 'd3-format';
// import {StateMachine} from 'state-machine';

class BarChart extends Histogram {
    constructor(opt) {
        super(opt);
        // private tooltip: D3Tooltip | undefined 
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
        // 将 svg 容器放到全局,供 update 使用
        this.selection = selection;
        // selection are chart container
        let grid = this.grid, svg = selection.append('svg')
            .attr('width', grid.width)
            .attr('height', grid.height);
        this.tooltip = new D3Tooltip(selection, 'b-tooltip');
        async function flow() {
            await this.requeryData(this.updateData);
            // await this.queryData()
            this.scale(svg);
            // 画 bar
            this.drawBar(svg);
            // 有了原始数据后,画legend
            let legendData = this.formatLegendData(this.dataset);
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
        let dealData = [...new Set(data.map((item) => item['PRODUCT_NAME']))];
        return dealData.reduce((acc, cur, i) => {
            let curItem = data.find((ele) => ele['PRODUCT_NAME'] == cur);
            acc.push({
                color: colors[i].HEX(), type: 'rect', label: curItem['PRODUCT_NAME'], value: curItem['SALES_VALUE']
            });
            return acc;
        }, []);
    }
    // updateChart(selection: Selection<any, unknown, any, any>) {
    //     selection.select('svg').remove();
    //     this.tooltip?.remove();
    //     this.draw(selection)
    // }
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
                    fsm[item] = d[item] || fsm[item];
                });
            }
            // 修改坐标轴的 dimension 
            self.xAxis.dimension = fsm.state;
            self.updateChart(selection);
        });
    }
    async requeryData(fn) {
        let { fsm, dimensions, option } = this, data = null;
        data = await fn.call(this, fsm, dimensions, option.fetch);
        this.dataset = this.parseData(data);
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
    drawBar(svg) {
        let xScale = this.xAxisBuilder.getScale();
        let { grid, xAxis, yAxis, property: p } = this;
        let yScale = this.yAxisBuilder.getScale();
        let barWidth = 16;
        const t = animationType();

        svg.selectAll('rect')
            .data(this.dataset)
            .enter()
            .append('rect')
            .classed('basic-bar', true)
            .attr("fill", p.colorPool[0].HEX())
            .attr('x', (d) => xScale(d[xAxis.dimension]) + xScale.bandwidth() / 2 - barWidth / 2)
            .attr('y', () => grid.height - grid.padding.pb - yAxis.offset - yAxis.edgeWidth)
            .attr('width', barWidth + "px")
            .attr('height', 0)
            .transition(t)
            .duration(1400)
            .attr('y', (d) => yScale(d[yAxis.dimension]))
            .attr('height', d => grid.height - grid.padding.pt - yAxis.offset - yAxis.edgeWidth - yScale(d[yAxis.dimension]))
    }
    mouseAction(svg) {
        let { grid, property: p, dataset, tooltip } = this, 
        curDimensions = [this.xAxis.dimension, this.yAxis.dimension], 
        { pl, pr } = grid.padding,
        yAxisWidth = getAxisSide(svg.select(`.${this.yAxis.className}`)), 
        leftBlank = pl + yAxisWidth;
        
        svg.on('mousemove', function () {
            let eachSpackWidth = (grid.width - leftBlank - pr) / dataset.length, 
                arr = dataset.map((_item, i) => i * eachSpackWidth), 
                curPoint = event.offsetX - leftBlank, 
                count = arr.findIndex((item, i) => item <= curPoint && arr[i + 1] >= curPoint);
            count = count < 0 ? dataset.length - 1 : count;
            let curData = dataset[Math.round(count)];
            let p = clientPoint(this, event);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.updatePosition(p);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setCurData(curData);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setCurDimensions(curDimensions);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setContent(function (data, dimensions) {
                if (!data) {
                    return `<p>本产品 - ${data['PRODUCT_NAME']}暂无数据</p>`;
                }
                return `<p>${data[dimensions[0]]} </p>
                        <!-- <p>市场规模${formatLocale("thousands").format("~s")(data['quote'])}</p> -->
                        <!-- <p>比例 ${format(".2%")(data[dimensions[1]])}</p> -->
                        <p>市场规模 ${formatLocale("thousands").format("~s")(data[dimensions[1]])}</p>`;
            });
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.show();
        });
        svg.on('mouseout', function () {
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.hidden();
        });
    }
}
export default BarChart;
