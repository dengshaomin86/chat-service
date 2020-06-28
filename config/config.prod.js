// 生产环境配置

'use strict';

module.exports = appInfo => {
  const config = exports = {};

  config.cors = {
    origin: ['http://139.9.50.13:8088'],
    credentials: true,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS'
  };

  return {
    ...config,
  };
};
