import DS from 'ember-data';

export default DS.Model.extend({
    bgColor: DS.attr(),
	colorPool: DS.attr(),
	commonts: DS.attr(),  // should be a relationship
	dataset: DS.attr(), // should be a relationship
	dimension: DS.attr(), // same up
	// 待添加 
	// legend: DS.attr(),
	// 以下用于设置drilldown / scrollup 操作
	dimensions: DS.attr(),
	measures: DS.attr(),
	// 地图坐标系
	geo: DS.attr(),
	grid: DS.attr(),
	pieAxis: DS.attr(),
	// 极坐标轴
	polar: DS.attr(),
	title: DS.attr('string'),
	// 当前图表类型
	mold: DS.attr('string'),
	xAxis: DS.attr(),
	yAxis: DS.attr(),
	fetch: DS.attr() // fetch config
});
