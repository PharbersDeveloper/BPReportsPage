import { selectAll, select } from 'd3-selection';

class D3Legend {
    constructor(svg, series) {
        this.type = 'plain'; // TODO scroll
        this.show = true;
        this.left = 'auto';
        this.top = 'auto';
        this.right = 'auto';
        this.bottom = 'auto';
        this.width = 'auto';
        this.height = 'auto';
        this.orient = 'horizontal'; // 'vertical'
        this.itemGap = 5;
        this.itemWidth = 8;
        this.itemHeight = 8;
        this.formatter = '';
        this.textStyle = {};
        this.icon = 'rect';
        this.data = [];
        this.svg = svg;
        this.data = series;
        // 演示使用
        // this.data = [
        //     { color: "red", type: 'circle', label: "Desktop", value: "230 people" },
        //     { color: "blue", type: 'rect', label: "Tablet", value: "18 people" },
        //     { color: "green", type: 'circle', label: "Mobile", value: "35 people" }
        // ]
        // const legend = container.append('div')
    }
    update(series, animate) {
        this.data = series;
        let legend = this.svg
            .append('g')
            .classed('d3-legend', true);
        // .attr('transform', 'translate(20,20)');
        let legendWidth = legend.node().getBBox();

        let items = legend
            .selectAll(".bp-legend-item")
            .data(series);

        // .join(
        //     enter => enter.append("g")
        //         .append('rect')
        //         .attr('width', 20)
        //         .attr('height', 20)
        //         .attr('fill', (d: any) => d.color)
        //         .attr('x', (_d: any, i: number) => 50 * i)
        //         .append('span')
        //         .text((d: any) => d.label)
        //         .attr('color', 'gray')
        //         .style('font-size', '15px')
        //     update => update,
        //     exit => exit.remove()
        // )
        // let exit = item.exit();
        let itemTag = this.orient === 'horizontal' ? 'g' : 'div';
        let enter = items.enter()
            .append('g')
            .classed("bp-legend-item", true)
            .attr('transform', (_d, i) => `translate(${80 * i},0)`);
        enter.append('rect')
            .attr('width', this.itemWidth)
            .attr('height', this.itemHeight)
            .attr('y', -8)
            .attr('fill', (d) => d.color)
            .attr('stroke', 'none')
            .attr('rx', 2)
            .attr('ry', 2);
        // let enterRect = enter.append((d:any) => 'rect')
        //     .attr('width', 20)
        //     .attr('height', 20)
        //     .attr('fill', (d: any) => d.color)
        let enterText = enter
            .append('text')
            .text((d) => d.label)
            .attr('fill', '#7A869A')
            .style('font-size', '12px')
            .attr('x', (_d, i) => 20)
            .attr('y', (_d, i) => 0);
        enter.selectAll('.bp-legend-item');

        this.updateItemsPosition(legend);
        this.updatePosition(legend);

        // let swatch = enter.append("rect")
        //     .attr('width',20)
        //     .attr('height',20)
        //     .classed("shart-swatch bp-legend-item-swatch", true)
        //     .style("background-color", function (d) { return d.color });
        // let label = enter.append("span")
        //     .classed("bp-legend-item-label", true)
        //     .text(function (d) { return d.label });
        // let value = enter.append("span")
        //     .classed("bp-legend-item-value", true)
        //     .text(function (d) { return d.value });
        // if (animate) {
        //     exit
        //         .transition()
        //         .style('opacity', 0)
        //         .remove();
        //     enter
        //         .style('opacity', 0)
        //         .transition()
        //         .duration(1000)
        //         .style('opacity', 1);
        // } else {
        //     exit
        //         .remove();
        // }
    }
    updatePosition(legend) {
        let legendWidth = legend.node().getBBox().width,
            svgWidth = this.svg.node().getBBox().width,
            restWidth = svgWidth - legendWidth;
            
        legend
            .attr('transform', `translate(${restWidth},20)`);
    }
    updateItemsPosition(legend) {
        let offsetLeft = 0,
            itemGap = this.itemGap;

        legend.selectAll('.bp-legend-item').each(function () {
            let curWidth = this.getBBox().width + itemGap,
                next = select(this).node().nextSibling;

            offsetLeft += curWidth;
            if (next) {
                select(next)
                    .attr('transform', `translate(${offsetLeft},0)`)
            }
        }); 
    }
    draw() {
        // this.svg
        //     .classed("chart-legend", true);
        this.update(this.data, true);
    }
}
export default D3Legend;