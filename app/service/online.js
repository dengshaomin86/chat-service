'use strict';

const Service = require('egg').Service;
class OnlineService extends Service {
  // 新增、更新在线用户
  async add() {
    const { ctx } = this;
    const username = ctx.session.username;
    if (!username) {
      return new Promise((resolve, reject) => {
        reject("用户未登录");
      });
    }
    const users = await ctx.model.User.find({
      usernameLowercase: (username).toLowerCase()
    });
    if (!users.length) {
      return new Promise((resolve, reject) => {
        reject("用户不存在");
      });
    }
    let data = {
      username,
      userId: users[0].userId,
      socketId: ctx.socket.id
    };
    const onlineUsers = await ctx.model.Online.find({
      username
    });
    if (onlineUsers.length) {
      return await ctx.model.Online.updateOne({
        username
      }, data);
    }
    return await ctx.model.Online.create(data);
  }

  // 删除在线用户
  async remove () {
    const { ctx } = this;
    return await ctx.model["Online"].deleteOne({
      username: ctx.session.username
    });
  }
}
module.exports = OnlineService;
