// import Route from '@ember/routing/route';
// import { inject as service } from '@ember/service';

// export default Route.extend({
//     ajax: service(),
//     qa: "http://192.168.100.174:3000/sql",
//     model() {
//         const queryXSql = "SELECT YM FROM result WHERE COMPANY = 'Sankyo' GROUP BY DATE ORDER BY DATE";
//         let months = [];

//         return this.ajax.request(this.qa + '?tag=array', {
//             method: 'POST',
//             data: JSON.stringify({ "sql": queryXSql }),
//             dataType: 'json'
//         }).then(data => {
//             months = data
//             const controller = this.controllerFor('index')
//             return controller.productQuery(data[data.length - 1])

//         }).then(data => {
//             return {
//                 products: data,
//                 months: months
//             }
//         })

//     },
//     setupController(controller, model) {
//         this._super(controller, model);
//         const { months, products } = model

//         controller.set("endDate", months[months.length - 1])
//         controller.set("prodName", products[0])

//     }
// });
import Route from "@ember/routing/route"
import { inject as service } from "@ember/service"
import RSVP from "rsvp"

export default Route.extend( {
	oauthService: service( "oauth-service" ),
	showNav: false,
	model() {
		return RSVP.hash( {
			page: this.oauthService.oauthOperation()
		} )
	}
} )
