// 生产环境配置

'use strict';

module.exports = (appInfo) => {
  const config = {};

  config.cluster = {
    listen: {
      port: 3000,
      hostname: '0.0.0.0', // 不建议设置 hostname 为 '0.0.0.0'，它将允许来自外部网络和来源的连接，请在知晓风险的情况下使用
      // path: '/var/run/egg.sock',
    },
  };

  config.cors = {
    origin: ['http://120.77.221.16:8088'],
    credentials: true,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  };

  return {
    ...config,
  };
};
