'use strict';

const {Service} = require('egg');
const {pick} = require('lodash');
const {storeMsgKey, getGroupName} = require('../core/baseConfig');

class ChatService extends Service {
  // 获取聊天列表
  list() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session} = ctx;
      const {userId, username} = session;

      const chat = await ctx.model.Chat.find({userId});

      // 遍历获取每个会话的最后一条消息
      let list = [];
      for (let idx in chat) {
        let item = chat[idx];
        switch (item.chatType) {
          case "1":
            const recordSingle = await ctx.model.RecordSingle.find({singleId: item.chatId});
            if (!recordSingle || !recordSingle.length) continue;
            const targetUserId = item.chatId.replace(userId, "");
            const targetUser = await ctx.model.User.findOne({userId: targetUserId});
            if (!targetUser) continue;
            list.push({
              ...pick(recordSingle[recordSingle.length - 1], storeMsgKey),
              chatType: "1",
              chatId: item.chatId,
              chatName: targetUser.username,
              chatAvatar: targetUser.avatar,
              withUsername: targetUser.username,
              withUserId: targetUser.userId,
              editTime: item.editTime,
            });
            break;
          case "2":
            const group = await ctx.model.Group.findOne({groupId: item.chatId});
            if (!group) continue;
            const {groupId, groupName, avatar, members} = group;
            const member = members.find(item => item.userId === userId);
            const joinTime = member.joinTime || 0;
            const createTime = member.leaveTime || new Date().getTime();
            const record = await ctx.model.RecordGroup.find({groupId, createTime: {$gt: joinTime, $lt: createTime}});
            if (!record || !record.length) continue;
            list.push({
              ...pick(record[record.length - 1], storeMsgKey),
              chatType: "2",
              chatId: groupId,
              chatName: getGroupName(groupName, members),
              chatAvatar: avatar,
              editTime: item.editTime,
            });
            break;
        }
      }

      // 按编辑时间排序
      list.sort((a, b) => {
        return new Date(a.editTime).getTime() < new Date(b.editTime).getTime() ? 1 : -1;
      });

      resolve(list);
    });
  }

  // 删除会话
  remove() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, params} = ctx;
      const {userId} = session;
      const {chatId} = params;
      await ctx.model.Chat.deleteOne({userId, chatId});
      resolve();
    });
  }

  // 更新会话(不存在则新增)
  updateChat({chatId, chatType, username, userId}) {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;

      await ctx.model.Chat.findOneAndUpdate({userId, chatId}, {
        userId,
        username,
        chatType,
        chatId,
        editTime: new Date().getTime()
      }, {upsert: true});

      await ctx.model.Chat.findOneAndUpdate({chatId}, {
        editTime: new Date().getTime()
      }, {new: true});

      resolve("success");
    });
  }
}

module.exports = ChatService;
