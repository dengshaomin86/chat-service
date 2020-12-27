'use strict';

const {Service} = require('egg');
const {pick} = require('lodash');
const {storeMsgKey} = require('../core/baseConfig');

class SingleService extends Service {
  // 创建单聊ID
  static createSingleId(fromUserId, toUserId) {
    return `${Math.min(fromUserId, toUserId)}${Math.max(fromUserId, toUserId)}`;
  }

  // 发起会话
  async send() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session} = ctx;
      const {userId, username} = session;
      const toUsername = ctx.query.username;
      const toUserId = ctx.query.userId;

      // 获取用户信息
      const user = await ctx.model.User.findOne({userId: toUserId});
      if (!user) {
        reject("用户不存在");
        return;
      }

      resolve({
        chatId: await SingleService.createSingleId(userId, toUserId),
        chatType: "1",
        chatName: toUsername,
        chatAvatar: user.avatar,
        msg: "",
        msgType: "1",
        toUsername,
        toUserId,
        createTime: "",
      });
    });
  }

  // 消息记录
  async record() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, params} = ctx;
      const {username, userId} = session;
      const {singleId} = params;

      let withUserId = singleId.replace(userId, "");
      let withUser = await ctx.model.User.findOne({userId: withUserId});
      if (!withUser) {
        resolve([]);
        return;
      }

      const record = await ctx.model.RecordSingle.find({singleId});
      if (!record || !record.length) {
        resolve([]);
        return;
      }

      // 处理消息内容
      let list = [];
      for (let idx  in record) {
        let item = record[idx];
        let {fromUserId} = item;
        let fromUserAvatar = await ctx.service.user.avatar(fromUserId);
        list.push({
          ...pick(item, storeMsgKey),
          fromUserAvatar,
          chatType: "1",
          chatId: singleId,
          chatName: withUser.username,
          chatAvatar: withUser.avatar,
          withUsername: withUser.username,
          withUserId: withUser.userId,
          withUserAvatar: withUser.avatar,
        });
      }
      resolve(list);
    });
  }
}

module.exports = SingleService;
