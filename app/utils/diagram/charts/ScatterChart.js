import Histogram from './Histogram';
import { getAxisSide } from '../scale/axisTransform';
import { select, event, clientPoint } from 'd3-selection';
import { animationType } from '../animation/animation';
import { min, max } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { schemeSet3 } from 'd3-scale-chromatic';
// import StateMachine from 'javascript-state-machine';
import { formatLocale, format } from 'd3-format';
import D3Tooltip from '../tooltip/Tooltip';
// import D3Legend from '../legend/Legend';

class ScatterChart extends Histogram {
    constructor(opt) {
        super(opt);
        this.fsm = null;
        // 格式化数据 -> 修改为在 queryData 之后格式化 
        // this.dataset = this.parseData(this.data.dataset);
        let dimensions = this.dimensions, 
            initFsmData = dimensions.reduce((acc, cur) => {
                acc[cur] = '';
                return acc;
            }, {}), 
            transitions = dimensions.map((d, i, arr) => {
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
        // 将 svg 容器放到全局,供 update 使用
        this.selection = selection;
        let grid = this.grid, svg = selection.append('svg')
            .attr('width', grid.width)
            .attr('height', grid.height);
        this.tooltip = new D3Tooltip(selection, 'b-tooltip');
        // this.scale(svg);
        // 画
        // this.drawScatter(svg);
        // action
        // this.mouseAction(svg);
        async function flow() {
            await this.requeryData(this.updateData);
            // 无坐标轴(dimension 信息保存在 geo 中);
            this.scale(svg);
            // 画 map
            await this.drawScatter(svg);
            // 有了原始数据后,画legend
            // let legendData = this.formatLegendData(this.dataset)
            // this.legend = new D3Legend(svg, legendData);
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
    async requeryData(fn) {
        let { fsm, dimensions, option } = this, data = null;
        data = await fn.call(this, fsm, dimensions, option.fetch);
        this.dataset = this.parseData(data);
    }
    testInteraction(svg) {
        let { fsm, selection, dimensions, dataset } = this;
        let self = this;
        svg.selectAll('circle').on('click', function (d) {
            let curData = d;
            let prov = d.PROVINCE;
            console.log(fsm)
            if (fsm.state === dimensions[dimensions.length - 1] || !curData) {
                self.currentProv = "全国";
                // TODO 当当前省份无数据时,进行 rollup 就出现错误,但是可以忽略
                // 如果是最后一个维度,则进行清空
                dimensions.forEach((item) => {
                    fsm[item] = '';
                });
                fsm.rollup();
                self.updateChart(selection);
            }
            else {
                self.currentProv = prov;
                
                fsm.drilldown();
                dimensions.forEach((item) => {
                    fsm[item] = curData[item] || fsm[item];
                });
                self.updateChart(selection);
            }
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
    drawScatter(svg) {
        let { grid, xAxis, yAxis, property: p, polar, dataset: data } = this,
            xScale = this.xAxisBuilder.getScale(),
            yScale = this.yAxisBuilder.getScale(),
            // 数据大小比例尺
            dataMaxValue = this.getAxisMaxValue(data, this.polar.dimension);

        const dataScale = scaleLinear()
            .domain([0, dataMaxValue])
            .range([polar.minRadius || 3, polar.maxRadius || 20]);
        const t = animationType();
        // scatter
        const circle = svg.selectAll('circle')
            .data(data)
            .join(enter => enter.append('circle'), update => update, exit => exit.remove()).attr('cx', (d) => xScale(d[xAxis.dimension]))
            .attr('cy', (d) => yScale(d[yAxis.dimension]));
        circle.transition(t)
            .duration(1600)
            .attr('r', (d) => dataScale(d[polar.dimension]) ? dataScale(d[polar.dimension]) : 5)
            .attr('fill', (_d, i) => {
                let len = p.colorPool.length;

                return p.colorPool[i % len].HEX();
            })
            .style('opacity', 0.6);
        circle.on('mouseover', function (d) {
            select(this)
                .transition(t)
                .duration(1600)
                .attr('r', () => dataScale(d[polar.dimension]) ? dataScale(d[polar.dimension]) * 1.4 : 7);
            
        }).on('mouseout', function (d) {
            select(this)
                .transition(t)
                .duration(1200)
                .attr('r', () => dataScale(d[polar.dimension]));
        });
    }
    getAxisMaxValue(data, property) {
        const yAxisData = data.map((datum) => datum[property]);
        return Math.max(Math.abs(min(yAxisData)), Math.abs(max(yAxisData)));
    }
    getAxisMinValue(data, property) {
        const AxisData = data.map((datum) => datum[property]);
        return min(AxisData);
    }
    calcYaxisData() {
        const data = this.dataset;
        const yMaxValue = this.getAxisMaxValue(data, this.yAxis.dimension),
            yMinValue = this.getAxisMinValue(data, this.yAxis.dimension);

        // const yAxis = axisLeft(yScale)
        // .tickFormat(format(".2%")); // format([.precision][type])
        this.yAxis = Object.assign(Object.assign({}, this.yAxis), {
            min: yMinValue > 0 ? 0 : yMinValue,
            max: yMaxValue,
        });
    }
    calcXaxisData() {
        const data = this.dataset;
        const xMaxValue = this.getAxisMaxValue(data, this.xAxis.dimension),
            xMinValue = this.getAxisMinValue(data, this.xAxis.dimension);

        this.xAxis = Object.assign(Object.assign({}, this.xAxis), {
            min: xMinValue > 0 ? 0 : xMinValue,
            max: xMaxValue,
        });
    }
    mouseAction(svg) {
        let { grid, property: p, dataset, tooltip, fsm } = this, curDimensions = [fsm.state];
        svg.selectAll("circle").on('mouseover', function (d) {
            // animation 
            // select(this)
            //     .transition(t)
            //     .duration(1600)
            //     .attr('r', () => dataScale(d[polar.dimension])?dataScale(d[polar.dimension]) * 1.4: 7);
            const curSelect = select(this);
            curSelect.classed('path-active', true);
            let point = clientPoint(this, event),
                // 可自定义 legend 通过此方式
                preLegend = {
                    content(data, dimensions) {
                        if (!data) {
                            return `<p>本市场暂无数据</p>`;
                        }
                        return `
                                <p>${data[dimensions[0]]}</p>
                                <p>产品销量 ${formatLocale("thousands").format("~s")(data['SALES_VALUE'])}</p>
                                <p>产品销量增长率 ${format(".2%")(data['SALES_VALUE_GROWTH_RATE'])}</p>
                                <p>产品份额 ${format(".2%")(data['PROD_SHARE'])}</p>`;
                    }
                };
                p.setLegendContent(p.getLegendContent() || preLegend.content);
                
            // p.legend = Object.assign(preLegend,p.legend);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.updatePosition(point);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setCurData(d);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setCurDimensions(curDimensions);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setContent(p.getLegendContent());
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.show();
        });
        svg.selectAll("circle").on('mouseout', function () {
            select(this)
                .classed('path-active', false);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.hidden();
        });
        // svg.selectAll('rect')
        //     .on('mouseover', function () {
        //         select(this).attr("fill", "#FFC400")
        //     })
        //     .on('mouseout', function () {
        //         select(this)
        //             .transition()
        //             .duration(1000)
        //             .attr("fill", p.colorPool[0].HEX())
        //     })
    }
}
export default ScatterChart;
