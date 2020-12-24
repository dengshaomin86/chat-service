// 用户登录校验
module.exports = (options, app) => {
  return async function auth(ctx, next) {
    if (!ctx.session.username) {
      ctx.body = {
        flag: false,
        auth: false,
        message: "请登录"
      };
      return;
    }
    await next();
  };
};
