import Component from '@ember/component';
import { select } from 'd3-selection';
import { isEmpty } from '@ember/utils';
import { ChartPaint, Notation, Text, } from 'max-bi-v2/utils/diagram/index'
import { getProperties } from '@ember/object';
export default Component.extend({
    // tagName: '',
    comp: '信立泰',
    prov: '广东',
    prod: '波立维片剂75MG7赛诺菲-安万特制药有限公司',
    year: 2019,
    quarter: 1,
    month: 1,
    classNames: ['bp-chart'],
    init() {
        this._super(...arguments);
        this.resetChartId();
    },
    updateData(fsm, dimensions, fetchConfig) {
        let { comp, prov, prod, year, quarter, month } = getProperties(this, "comp", "prov", "prod", "year", "quarter", "month");
        
        return new Promise((resolve) => {
            let state = fsm.state,
                sqlDimensions = dimensions.map(item => {
                    if (fsm[item]) {
                        return `AND ${item}.keyword = '${fsm[item]}'`
                    }
                    return ''
                })
            // TODO 内部具体动作应该提出到组件或者路由中操作
            if (state == "PROVINCE") {
                resolve(fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "sql": `SELECT ${state}, SALES_VALUE, SALES_QTY FROM fullcube2 WHERE MKT IN (SELECT MKT FROM fullcube2 WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND QUARTER = ${quarter} AND MONTH = ${month} AND PRODUCT_NAME = '${prod}') AND DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = 'MONTH-${state}-MKT' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND QUARTER = ${quarter} AND MONTH = ${month} AND COUNTRY.keyword = 'CHINA'` }),
                }))
            } else if (state === 'CITY') {
                let prov = fsm[dimensions[0]]
                resolve(fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "sql": `SELECT ${state}, SALES_VALUE, SALES_QTY FROM fullcube2 WHERE MKT IN (SELECT MKT FROM fullcube2 WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND QUARTER = ${quarter} AND MONTH = ${month} AND PRODUCT_NAME = '${prod}') AND DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = 'MONTH-${state}-MKT' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND QUARTER = ${quarter} AND MONTH = ${month} AND PROVINCE.keyword like '${prov}%'` }),
                }))
            }
        }).then((result) => {
            return result.json();
        }).then(data => {
            return data;
        })
    },
    didInsertElement() {
        this._super(...arguments);
        this.draw()
    },
    resetChartId() {
        const chartId = this.eid;
        this.set('chartId', 'chart' + chartId)
    },
    draw() {
        // let { histogram } = this;
        console.log(this.eid)
        let container = select(`#${this.chartId}`),
            comp = '信立泰',
            prov = '广东',
            prod = '波立维片剂75MG7赛诺菲-安万特制药有限公司',
            year = 2019,
            quarter = 1,
            month = 1;

        // 必须在draw 执行之前重设 updateData 的方法
        // let chartId = histogram.option.id;

        let chartConfPromise = null
        if (isEmpty(this.store)) {
            chartConfPromise = this.get('ajax').request(this.confReqAdd, {
                method: 'GET',
                data: this.eid
            })
        } else {
            chartConfPromise = this.store.findRecord("diagram", this.eid)
        }

        chartConfPromise.then(chart => {
            console.log(chart)
            // const config = data.styleConfigs
            // const condition = data.dataConfigs
            // if (!isEmpty(data.id) && !isEmpty(condition)) {
            //     // 处理提示框
            //     let tooltipType = config.tooltip.formatter;

            //     if (tooltipType in tooltips) {
            //         config.tooltip.formatter = tooltips[tooltipType]
            //     } else {
            //         delete config.tooltip.formatter
            //     }
            //     this.setProperties({
            //         dataConfig: config,
            //         dataCondition: condition
            //     });
            //     this.generateChartOption(config, condition);
            // }
            return {
                chart,
                histogram: new ChartPaint(chart),
                title: new Text(chart.title),
                commonts: (chart.commonts).map(comment => new Text(comment)),
                notation: new Notation()
            }
        }).then(data => {
            data.histogram.updateData = this.updateData.bind(this)
            data.histogram.draw(container)
        })
        /*
        switch (chartId) {
            case 'bar-test-2020-03-19':
                histogram.updateData = function (fsm, dimensions, fetchConfig) {
                    return new Promise((resolve) => {
                        let state = fsm.state, sqlDimensions = dimensions.map(item => {
                            if (fsm[item]) {
                                return `AND ${item}.keyword = '${fsm[item]}'`;
                            }
                            return '';
                        });
                        // TODO 内部具体动作应该提出到组件或者路由中操作
                        resolve(fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ "sql": `SELECT ${state}, PRODUCT_NAME, SALES_VALUE FROM fullcube2 WHERE DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-PROVINCE-PRODUCT_NAME' ${sqlDimensions.join(" ")} AND COMPANY = '${comp}' AND PROVINCE = '${prov}' AND PRODUCT_NAME.keyword = '${prod}'  ORDER BY ${state}.keyword` }),
                        }));
                    }).then((result) => {
                        return result.json();
                    }).then(data => {
                        return data;
                    });
                };
                break;
            case 'map-test-2020-03-24':
            case 'scatter-test-2020-04-09':
                histogram.updateData = function (fsm, dimensions, fetchConfig) {
                    return new Promise((resolve) => {
                        let state = fsm.state, sqlDimensions = dimensions.map(item => {
                            if (fsm[item]) {
                                return `AND ${item}.keyword = '${fsm[item]}'`;
                            }
                            return '';
                        });
                        // TODO 内部具体动作应该提出到组件或者路由中操作
                        if (state == "PROVINCE") {
                            resolve(fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ "sql": `SELECT ${state}, SALES_VALUE, SALES_QTY FROM fullcube2 WHERE MKT IN (SELECT MKT FROM fullcube2 WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND QUARTER = ${quarter} AND MONTH = ${month} AND PRODUCT_NAME = '${prod}') AND DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = 'MONTH-${state}-MKT' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND QUARTER = ${quarter} AND MONTH = ${month} AND COUNTRY.keyword = 'CHINA'` }),
                            }));
                        }
                        else if (state === 'CITY') {
                            let prov = fsm[dimensions[0]];
                            resolve(fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ "sql": `SELECT ${state}, SALES_VALUE, SALES_QTY FROM fullcube2 WHERE MKT IN (SELECT MKT FROM fullcube2 WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND QUARTER = ${quarter} AND MONTH = ${month} AND PRODUCT_NAME = '${prod}') AND DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = 'MONTH-${state}-MKT' AND COMPANY.keyword = '${comp}' AND YEAR = ${year} AND QUARTER = ${quarter} AND MONTH = ${month} AND PROVINCE.keyword like '${prov}%'` }),
                            }));
                        }
                    }).then((result) => {
                        return result.json();
                    }).then(data => {
                        return data;
                    });
                };
                break;
            case 'stack-test-2020-04-09':
                histogram.updateData = function (fsm, dimensions, fetchConfig) {
                    let state = fsm.state, sqlDimensions = dimensions.map(item => {
                        if (fsm[item]) {
                            return `AND ${item}.keyword = '${fsm[item]}'`;
                        }
                        return '';
                    });
                    return all([
                        fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ "sql": `SELECT ${state}, PRODUCT_NAME, SALES_VALUE, SALES_QTY FROM fullcube2 WHERE DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-PROVINCE-PRODUCT_NAME' AND COMPANY = '${comp}' AND PROVINCE = '${prov}' AND PRODUCT_NAME.keyword = '${prod}' ${sqlDimensions.join(" ")} ORDER BY ${state}.keyword` }),
                        }),
                        fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ "sql": `SELECT ${state}, MKT, SALES_VALUE, SALES_QTY FROM fullcube2 WHERE MKT IN (SELECT MKT FROM fullcube2 WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY = '信立泰' AND YEAR = 2019 AND QUARTER = 1 AND MONTH = 1 AND PRODUCT_NAME.keyword = '波立维片剂75MG7赛诺菲-安万特制药有限公司') AND DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-COUNTRY-MKT' AND COMPANY.keyword = '${comp}' AND COUNTRY.keyword = 'CHINA' ${sqlDimensions.join(" ")} ORDER BY ${state}.keyword` }),
                        })
                    ]).then((result) => {
                        return all(result.map((res) => {
                            return res.json();
                        }));
                    }).then((data) => {
                        let time = data[0].map((item) => {
                            return {
                                [fsm.state]: item[fsm.state]
                            };
                        }), result = time.reduce((acc, cur, i) => {
                            cur['其他产品'] = data[1][i]['SALES_VALUE'] - data[0][i]['SALES_VALUE'];
                            cur[data[0][i]['PRODUCT_NAME']] = data[0][i]['SALES_VALUE'];
                            return acc;
                        }, time);
                        console.log(result);
                        return result;
                    });
                };
                break;
            case 'stack-test-2020-04-10-mulit':
                histogram.updateData = function (fsm, dimensions, fetchConfig) {
                    let state = fsm.state, sqlDimensions = dimensions.map(item => {
                        if (fsm[item]) {
                            return `AND ${item}.keyword = '${fsm[item]}'`;
                        }
                        return '';
                    });
                    return fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ "sql": `SELECT ${state}, MOLE_NAME, SUM(SALES_VALUE) AS SALES_VALUE FROM fullcube2 WHERE DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-PROVINCE-MOLE_NAME' AND COMPANY = '${comp}' AND PROVINCE = '${prov}' AND MKT IN (SELECT MKT FROM fullcube2 WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY.keyword = '信立泰' AND YEAR = 2019 AND QUARTER = 1 AND MONTH = 1 AND PRODUCT_NAME = '介宁片剂50MG36山东新华医药集团有限责任公司') GROUP BY ${state}.keyword, MOLE_NAME.keyword ORDER BY ${state}.keyword` }),
                    }).then((result) => {
                        return result.json();
                    }).then((data) => {
                        let timeStr = [...new Set(data.map((item) => item[fsm.state]))], time = timeStr.map((item) => {
                            return {
                                [fsm.state]: item
                            };
                        }), result = time.reduce((acc, cur, i) => {
                            let state = fsm.state, curTimeData = data.filter((item) => item[state] === cur[state]);
                            curTimeData.forEach((item) => {
                                cur[item['MOLE_NAME']] = item['SALES_VALUE'];
                            });
                            return acc;
                        }, time);
                        return result;
                    });
                };
                break;
            case 'lines-test-2020-04-10':
                histogram.updateData = function (fsm, dimensions, fetchConfig) {
                    let state = fsm.state, sqlDimensions = dimensions.map(item => {
                        if (fsm[item]) {
                            return `AND ${item}.keyword = '${fsm[item]}'`;
                        }
                        return '';
                    });
                    return all([
                        fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ "sql": `SELECT ${state}, PRODUCT_NAME, SALES_VALUE, SALES_QTY FROM fullcube2 WHERE DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-PROVINCE-PRODUCT_NAME' AND COMPANY = '${comp}' AND PROVINCE = '${prov}' AND PRODUCT_NAME.keyword = '${prod}' ${sqlDimensions.join(" ")} ORDER BY ${state}.keyword` }),
                        }),
                        fetch(`${fetchConfig.address}?tag=${fetchConfig.tag}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ "sql": `SELECT ${state}, MKT, SALES_VALUE, SALES_QTY FROM fullcube2 WHERE MKT IN (SELECT MKT FROM fullcube2 WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY = '信立泰' AND YEAR = 2019 AND QUARTER = 1 AND MONTH = 1 AND PRODUCT_NAME.keyword = '波立维片剂75MG7赛诺菲-安万特制药有限公司') AND DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-COUNTRY-MKT' AND COMPANY.keyword = '${comp}' AND COUNTRY.keyword = 'CHINA' ${sqlDimensions.join(" ")} ORDER BY ${state}.keyword` }),
                        })
                    ]).then((result) => {
                        return all(result.map((res) => {
                            return res.json();
                        }));
                    }).then((data) => {
                        // let otherProds = data[1].map((item: any) => {
                        //     return {
                        //         PRODUCT_NAME: '其他产品',
                        //         ...item
                        //     }
                        // });
                        return data;
                    });
                };
                break;
            case 'lines-test-2020-04-10-import-product':
                histogram.updateData = function (fsm, dimensions, fc) {
                    let state = fsm.state, sqlDimensions = dimensions.map(item => {
                        if (fsm[item]) {
                            return `AND ${item}.keyword = '${fsm[item]}'`;
                        }
                        return '';
                    });
                    return resolve(fetch(`${fc.address}?tag=array`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ "sql": `SELECT PRODUCT_NAME FROM fullcube2 WHERE MKT IN (SELECT MKT FROM fullcube2 WHERE DIMENSION_NAME.keyword = '2-time-prod' AND DIMENSION_VALUE.keyword = 'MONTH-PRODUCT_NAME' AND COMPANY = '信立泰' AND YEAR = 2019 AND QUARTER = 1 AND MONTH = 1 AND PRODUCT_NAME.keyword = '波立维片剂75MG7赛诺菲-安万特制药有限公司') AND DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = 'QUARTER-COUNTRY-PRODUCT_NAME' AND COMPANY.keyword = '信立泰' AND YEAR = 2019 AND QUARTER = 1 AND COUNTRY.keyword = 'CHINA' ORDER BY SALES_VALUE DESC LIMIT 10` }),
                    })).then((data) => {
                        return data.json();
                    }).then((data) => {
                        if (data.includes(prod)) {
                            data.splice(data.indexOf(prod), 1);
                        }
                        data.unshift(prod);
                        return all(data.map((curProd) => {
                            return fetch(`${fc.address}?tag=${fc.tag}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ "sql": `SELECT ${state}, PRODUCT_NAME, SALES_VALUE FROM fullcube2 WHERE DIMENSION_NAME.keyword = '3-time-geo-prod' AND DIMENSION_VALUE.keyword = '${state}-PROVINCE-PRODUCT_NAME' AND COMPANY = '${comp}' AND PROVINCE = '${prov}' AND PRODUCT_NAME.keyword = '${curProd}' ${sqlDimensions.join(" ")} ORDER BY YEAR.keyword` }),
                            });
                        }));
                    }).then((result) => {
                        return all(result.map((res) => {
                            return res.json();
                        }));
                    }).then((data) => {
                        return data;
                    });
                };
                break;
            default:
                break;
        }
        */
        // histogram.draw(container);
    }
});
