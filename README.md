# max-bi-v2

## 组件依赖注入
使用 yarn link basic-components 将基础组件库注入（后期会发布基础组件库，只需要在 package.json 中写入此依赖即可）.  

在 package.json :
``` json
  "dependencies": {
    "basic-components": "*"
  }
```
同时安装其他的依赖：  
``` command
    ember install ember-cli-sass
    ember install ember-cli-echarts
    ember install ember-table
```

将 laydate 本地文件复制进 `/vendor` 文件夹内，同时修改 `ember-cli-build.js` 文件：
``` javascript
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

  return app.toTree();
};

```
## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/)
* [Yarn](https://yarnpkg.com/)
* [Ember CLI](https://ember-cli.com/)
* [Google Chrome](https://google.com/chrome/)

## Installation

* `git clone <repository-url>` this repository
* `cd max-bi-v2`
* `yarn install`

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).
* Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Running Tests

* `ember test`
* `ember test --server`

### Linting

* `yarn lint:hbs`
* `yarn lint:js`
* `yarn lint:js --fix`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

Specify what it takes to deploy your app.

## Further Reading / Useful Links

* [ember.js](https://emberjs.com/)
* [ember-cli](https://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)
