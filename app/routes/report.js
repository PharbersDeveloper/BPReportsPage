import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from "max-bi-v2/config/environment"

export default Route.extend({
    ajax: service(),
    qa: ENV.QueryAddress,
    compName: "信立泰",

    model() {
        const queryXSql = `SELECT YM FROM result WHERE COMPANY = '${this.compName}' GROUP BY DATE ORDER BY DATE`;
        let months = [],
            { host, port } = this.qa;
        return this.ajax.request(`${host}:${port}/sql?tag=array`, {
            method: 'POST',
            data: JSON.stringify({ "sql": queryXSql }),
            dataType: 'json'
        }).then(data => {
            months = data;

            return this.controllerFor('report').productQuery(data[data.length - 1])
        }).then(data => {
            return {
                products: data,
                months: months
            }
        })
    },
    setupController(controller, model) {
        this._super(controller, model);
        const { months, products } = model;

        controller.set("endDate", months[months.length - 1]);
        controller.set("prodName", products[0]);
    }
});