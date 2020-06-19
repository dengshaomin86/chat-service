'use strict';

const Service = require('egg').Service;
class UserService extends Service {
  // 新增用户
  async add(data) {
    const { ctx } = this;
    return await ctx.model.User.create(data);
  }
}
module.exports = UserService;
