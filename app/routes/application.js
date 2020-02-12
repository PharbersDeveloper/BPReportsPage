import Route from '@ember/routing/route';
import { inject as service } from "@ember/service"

export default Route.extend({
	oauthService: service( "oauth-service" ),

    beforeModel({ targetName }) {
		if (targetName === 'oauth-callback') {
			return;
		}

		if (this.oauthService.judgeAuth()) {
			if (targetName === 'index') {
				this.transitionTo('report');
			}
		} else {
			this.transitionTo('index');
		}
	},
});
