import Service from '@ember/service';
import { inject as service } from '@ember/service';

export default Service.extend({
    cookies: service(),
    ajax: service(),
    router: service(),

    groupName: '',
    version: 'v0',
    // online clientId 
    clientId: "5cb995a882a4a74375fa4201",
    // local clientId -> redirectUri:...4200
    // clientId: "5e43c0518c02f17e7d3c0b38",
    clientSecret: '5c90db71eeefcc082c0823b2',
    status: "self",
    scope: "APP/MAXBI",
    redirectUri: 'http://maxview.pharbers.com/oauth-callback',
    // redirectUri: 'http://maxview.pharbers.com:4200/oauth-callback',
    host: 'http://oauth.pharbers.com',

    oauthOperation() {
        const ajax = this.get('ajax')
        let host = `${this.get('host')}`,
            version = `${this.get('version')}`,
            resource = 'ThirdParty',
            url = '';

        url = `?client_id=${this.get('clientId')}
                    &client_secret=${this.get('clientSecret')}
                    &scope=${this.get('scope')}
                    &status=${this.get('status')}
                    &redirect_uri=${this.get('redirectUri')}`.
            replace(/\n/gm, '').
            replace(/ /gm, '').
            replace(/\t/gm, '');
        return ajax.request([host, version, resource, url].join('/'), {
            dataType: 'text'
            }).then(response => {
                return response;
            })
            .catch(err => {
                window.console.log('error');
                window.console.log(err);
            })
    },

    oauthCallback(transition) {
        let version = `${this.get('version')}`,
            host = `${this.get('host')}`,
			resource = 'GenerateAccessToken',
			url = '',
			cookies = this.get('cookies');
		const ajax = this.get('ajax'),
            { queryParams } = transition;
            
		if (queryParams.code && queryParams.state) {
			url = `?client_id=${this.get('clientId')}
					&client_secret=${this.get('clientSecret')}
					&scope=${this.get('scope')}
					&redirect_uri=${this.get('redirectUri')}
					&code=${queryParams.code}
					&state=${queryParams.state}`.
				replace(/\n/gm, '').
				replace(/ /gm, '').
				replace(/\t/gm, '');
			ajax.request([host, version, resource, url].join('/'))
				.then(response => {
                    this.removeAuth();
                    let expiry = new Date(response.expiry);
                    let options = {
                        domain: '.pharbers.com',
                        path: '/',
                        expires: expiry
                    }
                    cookies.write('token', response.access_token, options);
					cookies.write('account_id', response.account_id, options);
					cookies.write('access_token', response.access_token, options);
					cookies.write('refresh_token', response.refresh_token, options);
                    cookies.write('token_type', response.token_type, options);
                    cookies.write('scope', response.scope, options);
                    cookies.write('expiry', response.expiry, options);

					this.get('router').transitionTo('report');
				});
		} else {
			this.get('router').transitionTo('index');
		}
    },

    judgeAuth() {
        let tokenFlag = false;
        let scopeFlag = false;
		let token = this.get('cookies').read('token');
        let scope = this.get('cookies').read('scope');

		if(token != undefined && token != null && token != '') {
            tokenFlag = true;
        }
        
        if(scope != undefined && scope != null && scope != '') {
            let scopeString = scope.split("/")[1];
            let scopes = scopeString.split(",");
            scopes.forEach(elem => {
                let appScope = elem.split(":")[0];
                let scopeGroup = elem.split(":")[1];
                if(appScope == 'MAXBI' && scopeGroup != "" && scopeGroup != undefined) {
                    scopeFlag = true;
                }
            });
            scope.split("/")[1].split(",").forEach(elem => {
                let appScope = elem.split(":")[0];
                let scopeGroup = elem.split(":")[1];
                if(appScope == 'MAXBI' && scopeGroup != "" && scopeGroup != undefined) {
                    this.set('groupName', scopeGroup.split('#')[0]);
                }
            });
        }

        if(tokenFlag && scopeFlag) {
            return true;
		} else {
            return false;
        }
	},

    removeAuth() {
        this.set('groupName', '');
        let options = {
            domain: '.pharbers.com',
            path: '/',
        }
        this.cookies.clear("token", options)
        this.cookies.clear("account_id", options)
        this.cookies.clear("access_token", options)
        this.cookies.clear("refresh_token", options)
        this.cookies.clear("token_type", options)
        this.cookies.clear("scope", options)
        this.cookies.clear("expiry", options)
    },

});
