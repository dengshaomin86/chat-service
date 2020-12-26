/* eslint valid-jsdoc: "off" */

'use strict';

const path = require("path");
global.defaultAvatar = "/static/avatar/default.jpeg";

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {};

  config.cluster = {
    listen: {
      port: 3000,
      hostname: 'localhost', // 不建议设置 hostname 为 '0.0.0.0'，它将允许来自外部网络和来源的连接，请在知晓风险的情况下使用
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
      options: {
        useUnifiedTopology: true,
        useCreateIndex: true,
      },
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
    // origin: ['*'],
    origin: ['http://localhost:8080'],
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
        connectionMiddleware: ["connection"],
        packetMiddleware: ["packet"],
      },
      '/news': {
        connectionMiddleware: [],
        packetMiddleware: [],
      },
    },
  };

  config.view = {
    mapping: {
      '.ejs': 'ejs',
    },
  };

  config.static = {
    // 静态化访问前缀,如：`http://127.0.0.1:7001/static/images/logo.png`
    prefix: '/static/',
    dir: path.join(appInfo.baseDir, 'app/public/upload'), // `String` or `Array:[dir1, dir2, ...]` 静态化目录,可以设置多个静态化目录
    // dynamic: true, // 如果当前访问的静态资源没有缓存，则缓存静态文件，和`preload`配合使用；
    // preload: false,
    // maxAge: 31536000, // in prod env, 0 in other envs
    // buffer: true, // in prod env, false in other envs
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
