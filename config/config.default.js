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

  config.cluster = {
    listen: {
      port: 3000,
      hostname: '0.0.0.0', // 不建议设置 hostname 为 '0.0.0.0'，它将允许来自外部网络和来源的连接，请在知晓风险的情况下使用
      // path: '/var/run/egg.sock',
    }
  };

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
    domainWhiteList: ['*']
  };
  config.cors = {
    // origin: '*',
    origin: ['http://localhost:8080'],
    // origin: ['http://139.9.50.13:8088'],
    credentials: true,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS'
  };

  // session
  config.session = {
    key: 'SESSION_ID',  // 设置session cookie里面的key
    maxAge: 30 * 60 * 1000, // 设置过期时间 30 分钟
    httpOnly: true,
    encrypt: true,
    renew: true         // renew等于true 那么每次刷新页面的时候 session都会被延期
  };

  // socket.io
  config.io = {
    init: {},
    namespace: {
      '/': {
        connectionMiddleware: ["auth"], // 这里我们可以做一些权限校验之类的操作
        packetMiddleware: ["filter"], // 通常用于对消息做预处理，又或者是对加密消息的解密等操作
      },
      '/news': {
        connectionMiddleware: [],
        packetMiddleware: [],
      },
    },
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
