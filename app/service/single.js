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
      const withUserId = ctx.query.userId;

      // 获取用户信息
      const user = await ctx.model.User.findOne({userId: withUserId});
      if (!user) {
        reject("用户不存在");
        return;
      }

      const chatId = await SingleService.createSingleId(userId, withUserId);

      // 插入会话列表
      await ctx.service.chat.updateChat({
        chatId,
        chatType: "1",
        username,
        userId
      });

      resolve({
        chatId,
        chatType: "1",
        chatName: user.username,
        chatAvatar: user.avatar,
        withUsername: user.username,
        withUserId,
        createTime: new Date(),
        editTime: new Date(),
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
