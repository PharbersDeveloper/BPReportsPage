import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
    ajax: service(),
    qa: "http://192.168.100.174:3000/sql",
    model() {
        const queryXSql = "SELECT YM FROM test2 WHERE COMPANY = 'Sankyo' GROUP BY YM ORDER BY YM";
        let months = [];

        return this.ajax.request(this.qa + '?tag=array', {
            method: 'POST',
            data: JSON.stringify({ "sql": queryXSql }),
            dataType: 'json'
        }).then(data => {
            months = data
            const controller = this.controllerFor('index')
            return controller.productQuery(data[data.length - 1])

        }).then(data => {
            return {
                products: data,
                months: months
            }
        })

    },
    setupController(controller, model) {
        this._super(controller, model);
        const { months, products } = model

        controller.set("endDate", months[months.length - 1])
        controller.set("prodName", products[0])

    }
});