'use strict';

const Service = require('egg').Service;
const room = "default_room";

class OnlineService extends Service {
  // 新增、更新在线用户
  async add() {
    const {ctx} = this;
    const {username, userId} = ctx.session;
    if (!username) return false;
    const users = await ctx.model.User.findOne({userId});
    if (!users) {
      return new Promise((resolve, reject) => {
        reject("用户不存在");
      });
    }
    let data = {
      username,
      userId: users.userId,
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
  async remove() {
    const {ctx} = this;
    const {username} = ctx.session;
    return await ctx.model["Online"].deleteOne({
      username
    });
  }
}

module.exports = OnlineService;
