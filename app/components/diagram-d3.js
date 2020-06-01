import Component from '@ember/component';
import { select } from 'd3-selection';
import { isEmpty } from '@ember/utils';
import { ChartPaint, Notation, Text, } from 'max-bi-v2/utils/diagram/index';

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
    // 当前图表的 legend ,
    /**
     * @author Frank Wang
     * @method
     * @name legendContent
     * @description chart's legend
     * @param data
     * @param dimensions
     * @param jsm - javascript state - machine
     * @return {string}
     * @example 创建例子。
     * @public
     */
    // legendContent(/**data,dimensions,jsm */) {

    // },
    legendContent: null,
    oldtestSimonProvince: "全国",
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
            console.log("changeProv", this.data)

            typeof this.onChangeProv === 'function' ? this.onChangeProv(prov) : null
        }
    },
    draw() {
        let container = select(`#${this.chartId}`),
            chartConfPromise = null,
            eid = this.eid,
            cid = this.chartId,
            oldtestSimonProvince = this.oldtestSimonProvince,
            testSimonProvince = this.testSimonProvince;

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
            chart.legend = Object.assign(chart.legend || {}, { content: this.legendContent })
            
            return {
                chart,
                histogram: new ChartPaint(chart),
                title: new Text(chart.title),
                commonts: (chart.commonts).map(comment => new Text(comment)),
                notation: new Notation()
            }
        }).then(data => {
            this.data = data
            console.log("d3 data," , data)
            data.histogram.updateData = this.updateData.bind(this)
            // data.histogram.draw(container)
            // data.histogram.cid = cid
            if (eid === "5e9fb821c44f045878415ead" && oldtestSimonProvince !== testSimonProvince) {
                // 通过 didUpdateAttrs 触发重新绘制
                // 修改 fsm 数据
                // 清除原有图表
                // 重新绘制 
                data.histogram.fsm.PROVINCE = this.testSimonProvince.substring(0,2)
                data.histogram.fsm.drilldown();
                container.selectAll('svg').remove();
                container.selectAll('div').remove();
                data.histogram.draw(container)
            } else {
                data.histogram.draw(container)
            }
        })
    },
    removeSvg(container) {
        container.selectAll('svg').remove();
        container.selectAll('div').remove();
    }
});
