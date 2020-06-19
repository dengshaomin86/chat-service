/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1592543246609_218';

  // add your middleware config here
  config.middleware = [];

  // 连接mongodb的配置
  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1:27017/chatEgg',
      options: {},
    },
  };

  // 设置跨域访问
  config.security = {
    csrf: {
      enable: false
    },
    domainWhiteList: [ '*' ]
  };
  config.cors = {
    // origin: '*',
    origin: ['http://localhost:8080'],
    credentials: true,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS'
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
