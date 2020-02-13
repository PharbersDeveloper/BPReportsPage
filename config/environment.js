'use strict';

module.exports = function (environment) {
  let ENV = {
    modulePrefix: 'max-bi-v2',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
    scope: "APP/MAXBI",
    redirectUri: 'http://maxview.pharbers.com/oauth-callback',
    // redirectUri: 'http://maxview.pharbers.com:4200/oauth-callback',

    OAuth: {
      version: "v0",
      // clientId: "5cb995a882a4a74375fa4201", //线上
      clientId: "5e43c0518c02f17e7d3c0b38", //线下
      clientSecret: "5c90db71eeefcc082c0823b2",
      status: "self",
      scope: "APP/MAXBI",
      host: 'http://oauth.pharbers.com',
      redirectUri: 'http://maxview.pharbers.com:4200/oauth-callback'
    },
    QueryAddress: {
      host: "http://192.168.100.174",
      port: 3000,
      version: "",
      db: ""
    },
    tableQueryAddress: {
      host: "http://maxview.pharbers.com",
      port: 80,
      version: "",
      db: ""
    }
  };

  if (environment === 'development') {
    ENV.QueryAddress.host = "http://192.168.100.174"
    ENV.QueryAddress.port = 3000
    ENV.OAuth.clientId = "5e43c0518c02f17e7d3c0b38"
    ENV.OAuth.redirectUri = 'http://maxview.pharbers.com:4200/oauth-callback'
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    ENV.QueryAddress.host = "http://es-sql-server"
    ENV.QueryAddress.port = 3000
    ENV.OAuth.clientId = "5cb995a882a4a74375fa4201"
    ENV.OAuth.redirectUri = 'http://maxview.pharbers.com/oauth-callback'
  }

  return ENV;
};
