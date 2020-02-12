import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
	oauth_service: service(),
    beforeModel(transition) {
		this.oauth_service.oauthCallback(transition)
	}
});
