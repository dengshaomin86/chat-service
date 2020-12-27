'use strict';

const {Service} = require('egg');
const {pick} = require('lodash');
const {recordGroupKey} = require('../core/baseConfig');

function createChatId(fromUserId, toUserId) {
  return `${Math.min(fromUserId, toUserId)}&${Math.max(fromUserId, toUserId)}`;
}

class ChatService extends Service {
  // 获取聊天列表
  list() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session} = ctx;
      const {userId, username} = session;

      const chat = await ctx.model.Chat.findOne({userId});

      if (!chat) {
        resolve([]);
        return;
      }

      let chatList = chat.list || [];

      // 遍历获取每个会话的最后一条消息
      let list = [];
      for (let idx in chatList) {
        let item = chatList[idx];
        switch (item.chatType) {
          case "1":
            let msgList = await ctx.model.Message.find({chatId: item.chatId});
            break;
          case "2":
            const group = await ctx.model.Group.findOne({groupId: item.chatId});
            if (!group) return;
            const {groupId, groupName, avatar} = group;
            const record = await ctx.model.RecordGroup.find({groupId});
            if (!record || !record.length) return;
            list.push({
              ...pick(record[record.length - 1], recordGroupKey),
              chatType: "2",
              chatId: groupId,
              name: groupName,
              avatar,
              groupId,
              groupName,
            });
            break;
        }
      }

      resolve(list);
    });
  }

  // 新增聊天列表
  async add() {
    const {ctx} = this;
    const params = ctx.query;
    const {username} = params;

    // 获取用户信息
    const user = await ctx.model.User.findOne({username});
    if (!user) return null;
    const {userId, avatar} = user;

    let chatObj = null;
    if (params.type === "1") {
      // 单聊
      chatObj = {
        chatId: createChatId(ctx.session.userId, userId),
        chatType: "1",
        msg: "",
        msgDate: "",
        msgType: "1",
        toUsername: username,
        toUserId: userId,
        avatar,
        name: username
      };
    }
    return chatObj;
  }

  // 加入会话列表
  appendChat({chatId, chatType, username, userId}) {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;

      let chat = await ctx.model.Chat.findOne({userId});
      if (!chat) {
        await ctx.model.Chat.create({
          userId,
          username,
          list: [
            {
              chatId,
              chatType,
            }
          ]
        });
        resolve("success");
        return;
      }

      let {list} = chat;
      if (list.find(item => item.chatId === chatId)) {
        reject("已存在");
        return;
      }

      list.push({chatId, chatType});
      chat.list = list;
      await ctx.model.Chat.updateOne({userId}, chat);

      resolve("success");
    });
  }

  // 更新聊天列表
  async updateChatList(msgObj) {
    const {ctx} = this;

    // 发送方
    let userChatList = await ctx.model.Chat.find({
      userId: msgObj.fromUserId
    });
    if (userChatList.length) {
      let userChatObj = userChatList[0];
      let idx = userChatObj.list.findIndex(item => item === msgObj.chatId);
      if (idx !== -1) userChatObj.list.splice(idx, 1);
      userChatObj.list.unshift(msgObj.chatId);
      await ctx.model.Chat.updateOne({
        userId: msgObj.fromUserId
      }, userChatObj);
    } else {
      await ctx.model.Chat.create({
        username: msgObj.fromUsername,
        userId: msgObj.fromUserId,
        list: [msgObj.chatId]
      });
    }

    // 接收方
    userChatList = await ctx.model.Chat.find({
      userId: msgObj.toUserId
    });
    if (userChatList.length) {
      let userChatObj = userChatList[0];
      let idx = userChatObj.list.findIndex(item => item === msgObj.chatId);
      if (idx !== -1) userChatObj.list.splice(idx, 1);
      userChatObj.list.unshift(msgObj.chatId);
      await ctx.model.Chat.updateOne({
        userId: msgObj.toUserId
      }, userChatObj);
    } else {
      await ctx.model.Chat.create({
        username: msgObj.toUsername,
        userId: msgObj.toUserId,
        list: [msgObj.chatId]
      });
    }
  }
}

module.exports = ChatService;
