'use strict';

const Service = require('egg').Service;

class ChatListService extends Service {
  // 新增聊天列表
  async add() {
    const {ctx} = this;
    const params = ctx.query;

    const userChatList = await ctx.model.ChatList.find({
      username: ctx.session.username
    });

    let chatObj = null;
    if (params.type === "1") {
      const chatId = `${Math.min(ctx.session.userId, params.userId)}&${Math.max(ctx.session.userId, params.userId)}`;
      chatObj = {
        type: "1",
        chatId,
        name: params.username,
        lastMsg: "hello",
        lastMsgDate: new Date().getTime(),
        lastMsgUser: ctx.session.username
      };
    }

    if (!userChatList.length) {
      // 没有用户聊天数据，则新增一张用户的聊天列表数据
      let newUserChatList = {
        username: ctx.session.username,
        userId: ctx.session.userId,
        chatList: [chatObj],
      };
      return await ctx.model.ChatList.create(newUserChatList);
    } else {
      // 更新用户聊天列表数据
      let data = userChatList[0];
      if (data.chatList.find(item => item.chatId === chatObj.chatId)) {
        return new Promise((resolve, reject) => {
          reject("聊天已存在");
        });
      }
      data.chatList.unshift(chatObj);
      return await ctx.model.ChatList.updateOne({
        username: ctx.session.username
      }, data);
    }
  }

  // 添加好友时给双方新增聊天记录
  async bothAdd() {

  }
}

module.exports = ChatListService;
