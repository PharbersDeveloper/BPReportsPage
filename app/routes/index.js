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
