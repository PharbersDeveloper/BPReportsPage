import Component from '@ember/component';
import { select } from 'd3-selection';
import { isEmpty } from '@ember/utils';
import { ChartPaint, Notation, Text, } from 'max-bi-v2/utils/diagram/index'
import { getProperties } from '@ember/object';
import { computed } from '@ember/object';

export default Component.extend({
    // tagName: '',
    comp: '信立泰',
    prov: '全国',
    prod: '波立维片剂75MG7赛诺菲-安万特制药有限公司',
    year: 2019,
    quarter: 1,
    month: 1,
    classNames: ['bp-chart'],
    init() {
        this._super(...arguments);
        this.resetChartId();
    },
    updateData( /*fsm , dimensions, fetchConfig*/) {
        // dosomething 
    },
    didUpdateAttrs() {
        this._super(...arguments);
        let container = select(`#${this.chartId}`);
        if (container.selectAll('svg').nodes().length) {
            this.removeSvg(container);
            this.draw()
        }
    },
    didInsertElement() {
        this._super(...arguments);
        this.draw();
    },
    resetChartId() {
        const chartId = this.eid;
        this.set('chartId', 'chart' + chartId)
    },
    actions: {
        changeProv() {
            let prov = this.data.histogram.currentProv;

            typeof this.onCHangeProv === 'function' ?this.onChangeProv(prov):null
        }
    },
    draw() {
        let container = select(`#${this.chartId}`),
        chartConfPromise = null;

        // 必须在draw 执行之前重设 updateData 的方法
        if (isEmpty(this.store)) {
            chartConfPromise = this.get('ajax').request(this.confReqAdd, {
                method: 'GET',
                data: this.eid
            })
        } else {
            chartConfPromise = this.store.findRecord("diagram", this.eid)
        }

        chartConfPromise.then(chart => {
            return {
                chart,
                histogram: new ChartPaint(chart),
                title: new Text(chart.title),
                commonts: (chart.commonts).map(comment => new Text(comment)),
                notation: new Notation()
            }
        }).then(data => {
            this.data = data
            data.histogram.updateData = this.updateData.bind(this)
            data.histogram.draw(container);
        })
    },
    removeSvg(container) {
        container.selectAll('svg').remove();
        container.selectAll('div').remove();
    }
});
