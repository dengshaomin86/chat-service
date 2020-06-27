'use strict';

const Service = require('egg').Service;

// 创建用户 ID
async function createID(ctx) {
  let userId = String(Math.floor(Math.random() * 1000000));
  let users = await ctx.model.User.find({
    userId
  });
  while (users.length) {
    userId = String(Math.floor(Math.random() * 1000000));
    users = await ctx.model.User.find({
      userId
    });
  }
  return String(userId);
}

class UserService extends Service {
  // 新增用户
  async add(data) {
    const { ctx } = this;
    const userId = await createID(ctx);
    let user = {
      username: data.username,
      usernameLowercase: data.username,
      password: data.password,
      userId
    };
    return await ctx.model.User.create(user);
  }
}
module.exports = UserService;
