import { BarChart, LineChart, PieChart, ScatterChart, StackChart, MapChart } from '../index';
class ChartPaint {
    constructor(chart) {
        let histogram;
        switch (chart.mold) {
            case 'bar':
                histogram = new BarChart(chart);
                break;
            case 'line':
                histogram = new LineChart(chart);
                break;
            case 'pie':
                histogram = new PieChart(chart);
                break;
            case 'map':
                histogram = new MapChart(chart);
                break;
            case 'stack':
                histogram = new StackChart(chart);
                break;
            case 'scatter':
                histogram = new ScatterChart(chart);
                break;
            default:
                histogram = new BarChart(chart);
                break;
        }
        return histogram;
    }
}
export default ChartPaint;
 