import Histogram from './Histogram';
import { select, clientPoint } from 'd3-selection';
import { json, xml } from 'd3-fetch';
import { max } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { geoPath, geoMercator } from 'd3-geo';
import { animationType } from '../animation/animation';
// import StateMachine from 'javascript-state-machine';
import D3Tooltip from '../tooltip/Tooltip';
import { formatLocale, format } from 'd3-format';

/**
 * data format
    [
        {
            label: '山东省',
            sales: 22000.25,
            quote: 2584466.75,
            rate: "0.8757",
            product: "all"
        },
        {
            label: '广东省',
            sales: 2194822.975,
            quote: 2643496,
            rate: "0.8303",
            product: "all"
        },
        {
            label: '北京市',
            sales: 2359731.25,
            quote: 2770609.75,
            rate: "0.8517",
            product: "all"
        },
        {
            label: '陕西省',
            sales: 2165844.0625,
            quote: 2914783.4375,
            rate: "0.7431",
            product: "all"
        },
        {
            label: '吉林省',
            sales: 704715.671875,
            quote: 2274136,
            rate: "0.3099",
            product: "all"
        },
        {
            label: '广西壮族自治区',
            sales: 677539.40625,
            quote: 2806879,
            rate: "0.2414",
            product: "all"
        },
        {
            label: '内蒙古自治区',
            sales: 679346.203125,
            quote: 2975934,
            rate: "0.2283",
            product: "all"
        }
    ]
 */
class MapChart extends Histogram {
    constructor(opt) {
        console.log("🍎")
        console.log(opt)
        super(opt);
        this.fsm = null;
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
        // 将 svg 容器放到全局,供 update 使用
        this.selection = selection;
        let grid = this.grid;
        let svg = selection.append('svg')
            .attr('width', grid.width)
            .attr('height', grid.height);
        this.tooltip = new D3Tooltip(selection, 'b-tooltip');
        async function flow() {
            await this.requeryData(this.updateData);
            // 无坐标轴(dimension 信息保存在 geo 中);
            // this.scale(svg);
            // 画 map
            await this.drawMap(svg);
            // 添加交互
            this.mouseAction(svg);
            // 测试交互
            this.testInteraction(svg);
        }
        flow.call(this);
    }
    // updateChart(selection: Selection<any, unknown, any, any>) {
    //     selection.select('svg').remove();
    //     this.tooltip?.remove();
    //     this.draw(selection)
    // }
    async requeryData(fn) {
        let { fsm, dimensions, option } = this, data = null;
        data = await fn.call(this, fsm, dimensions, option.fetch);
        this.dataset = this.parseData(data);
    }
    testInteraction(svg) {
        let { fsm, selection, dimensions, dataset } = this;
        let self = this;
        svg.selectAll('path').on('click', function (d) {
            let prov = d.properties.name, curData = dataset.find((provData) => prov.includes(provData[fsm.state]));
            if (fsm.state === dimensions[dimensions.length - 1] || !curData) {
                // TODO 当当前省份无数据时,进行 rollup 就出现错误,但是可以忽略
                // 如果是最后一个维度,则进行清空
                dimensions.forEach((item) => {
                    fsm[item] = '';
                });
                fsm.rollup();
                self.updateChart(selection);
            }
            else {
                fsm.drilldown();
                dimensions.forEach((item) => {
                    fsm[item] = curData[item] || fsm[item];
                });
                self.updateChart(selection);
            }
            // if (fsm.state === 'province') {
            //     fsm.scrollup()
            // } else {
            //     fsm.drilldown()
            // }
            // self.updateChart(selection);
            // 修改 fsm 的 data-以便获取数据的时候可以得知维度信息
            // 修改坐标轴的 dimension 
            // self.geo.dimension = fsm.state
        });
    }
    drawMap(svg) {
        let { grid, property: p, geo, dataset, fsm, dimensions } = this;
        // const tooltipIns = new D3Tooltip(container, 'map-tooltip')

        const maxData = max(dataset.map((datum) => datum[geo.dimension]));
        // const minData = min(dataset.map((datum: any[]) => datum[geo.dimension]))
        const color = scaleLinear()
            .domain([0, maxData])
            .range(['#B8D4FA', '#18669A']);
        // .range(["#E7F0FE","#B8D4FA","#8ABCF4","#5CA6EF",
        //     "#3492E5",
        //     "#1E7EC8",
        //     "#18669A"
        // ])
        this.showRect(svg)
        if (fsm.state === dimensions[0]) {
            return xml("../assets/json/southchinasea.svg").then(xmlDocument => {
                svg.html(function () {
                    return select(this).html() + xmlDocument.getElementsByTagName("g")[0].outerHTML;
                });
                const southSea = select("#southsea");
                let southSeaWidth = southSea.node().getBBox().width / 5;
                let southSeaH = southSea.node().getBBox().height / 5;
                select("#southsea")
                    .classed("southsea", true)
                    .attr("transform", `translate(${grid.width - southSeaWidth - grid.padding.pr},${grid.height - southSeaH - grid.padding.pb}) scale(0.2)`)
                    .attr("fill", "#fafbfc");
                return json('../assets/json/chinawithoutsouthsea.json');
            }).then(geoJson => {
                const projection = geoMercator()
                    .fitSize([grid.width, grid.height], geoJson);
                const path = geoPath().projection(projection);
                const paths = svg
                    .selectAll("path.map")
                    .data(geoJson.features)
                    .enter()
                    .append("path")
                    .classed("map", true)
                    .attr("fill", "#fafbfc")
                    .attr("stroke", "white")
                    .attr("class", "continent")
                    .attr("d", path);
                const t = animationType();
                paths.transition(t)
                    .duration(1000)
                    .attr('fill', (d) => {
                        let prov = d.properties.name;
                        let curProvData = dataset.find((provData) => prov.includes(provData['PROVINCE']));
                        return color(curProvData ? curProvData[geo.dimension] : 0);
                    });
            });
        }
        else {
            return json(`../assets/json/provinces/${fsm[dimensions[0]]}.json`).then(geoJson => {
                const projection = geoMercator()
                    .fitSize([grid.width, grid.height], geoJson);
                const path = geoPath().projection(projection);
                const paths = svg
                    .selectAll("path.map")
                    .data(geoJson.features)
                    .enter()
                    .append("path")
                    .classed("map", true)
                    .attr("fill", "#fafbfc")
                    .attr("stroke", "white")
                    .attr("class", "continent")
                    .attr("d", path);
                const t = animationType();
                paths.transition(t)
                    .duration(600)
                    .attr('fill', (d) => {
                        let prov = d.properties.name;
                        let curProvData = dataset.find((provData) => prov.includes(provData['CITY']));
                        return color(curProvData ? curProvData[geo.dimension] : 0);
                    });
            });
        }

    }
    showRect(svg) {
        let { grid, property: p, geo, dataset, fsm, dimensions } = this;
        const maxData = max(dataset.map((datum) => datum[geo.dimension]));

        // 显示渐变矩形条
        const linearGradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "linearColor")
            //颜色渐变方向
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");
        // //设置矩形条开始颜色
        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", '#8ABCF4');
        // //设置结束颜色
        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", '#18669A');
        svg.append("rect")
            //x,y 矩形的左上角坐标
            .attr("x", 24)
            .attr("y", grid.height - 83 - grid.padding.pb) // 83为矩形的高
            //矩形的宽高
            .attr("width", 16)
            .attr("height", 83)
            //引用上面的id 设置颜色
            .style("fill", "url(#" + linearGradient.attr("id") + ")");
        // //设置文字
        // // 数据初值
        svg.append("text")
            .attr("x", grid.padding.pl + 16 + 8)
            .attr("y", grid.height - grid.padding.pb)
            .text(0)
            .classed("linear-text", true);
        // // visualMap title
        svg.append("text")
            .attr("x", grid.padding.pl)
            .attr("y", grid.height - 83 - grid.padding.pb - 8) // 8为padding
            .text('市场规模')
            .classed("linear-text", true);
        // //数据末值
        svg.append("text")
            .attr("x", grid.padding.pl + 16 + 8)
            .attr("y", grid.height - 83 - grid.padding.pb + 12) // 12 为字体大小
            .text(format("~s")(maxData))
            .classed("linear-text", true)
    }
    mouseAction(svg) {
        let { grid, property: p, dataset, tooltip, fsm } = this,
            { pl, pr } = grid.padding,
            leftBlank = pl,
            curDimensions = [fsm.state];

        svg.selectAll("path").on('mousemove', function (d) {
            const curSelect = select(this);
            curSelect.classed('path-active', true);
            let prov = d.properties.name, 
                curData = dataset.find((provData) => prov.includes(provData[curDimensions[0]]));
            let p = clientPoint(this, event);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.updatePosition(p);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setCurData(curData);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setCurDimensions(curDimensions);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.setContent(function (data, dimensions) {
                if (!data) {
                    return `<p>本市场暂无数据</p>`;
                }
                return `
                        <p>${data[dimensions[0]]} 市场概况</p>
                        <p>市场规模${formatLocale("thousands").format("~s")(data['SALES_QTY'])}</p>
                        <p>销售额 ${formatLocale("thousands").format("~s")(data['SALES_VALUE'])}</p>
                        <!-- <p>sales ${format(".2%")(data['sales'])}</p> -->`;
            });
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.show();
        });
        svg.selectAll("path").on('mouseout', function () {
            select(this)
                .classed('path-active', false);
            tooltip === null || tooltip === void 0 ? void 0 : tooltip.hidden();
        });
    }
}
export default MapChart;