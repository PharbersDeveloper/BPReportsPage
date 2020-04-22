'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    // Add options here
  });

  // layui-laydate
  app.import("vendor/laydate/theme/default/font/iconfont.eot", {
    destDir: '/assets/laydate/fonts'
  })
  app.import("vendor/laydate/theme/default/font/iconfont.svg", {
    destDir: '/assets/laydate/fonts'
  })
  app.import("vendor/laydate/theme/default/font/iconfont.ttf", {
    destDir: '/assets/laydate/fonts'
  })
  app.import("vendor/laydate/theme/default/font/iconfont.woff", {
    destDir: '/assets/laydate/fonts'
  })
  app.import("vendor/laydate/theme/default/laydate.css")
  app.import("vendor/laydate/laydate.js")
  // echart
  app.import('node_modules/echarts/map/js/china.js');

  app.import('node_modules/javascript-state-machine/lib/state-machine.js');
  return app.toTree();
};
