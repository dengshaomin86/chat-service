'use strict';

const Service = require('egg').Service;

class MessageService extends Service {
  // 新增对话
  async add(msgObj) {
    const {ctx} = this;
    return await ctx.model.Message.create(msgObj);
  }

  // 获取聊天记录
  async getMsgList() {
    const {ctx} = this;
    const params = ctx.query;
    let list = [];

    // 查找是否有对应的聊天列表
    const messageList = await ctx.model.Message.find({
      chatId: params.chatId
    });
    if (messageList.length) list = messageList;

    // 群聊
    if (params.chatId === "group001") {
      const messageGroupList = await ctx.model.MessageGroup.find({
        chatId: params.chatId
      });
      if (messageGroupList.length) list = messageGroupList;

      list.unshift({
        chatId: "group001",
        chatType: "2", // 群聊
        name: "默认群聊",
        msg: "hello everyone",
        msgDate: new Date("2020/06/06 06:06:06").getTime(),
        fromUsername: "管理员",
        fromUserId: "001"
      });
    }

    return list;
  }
}

module.exports = MessageService;
