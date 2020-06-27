'use strict';

const Service = require('egg').Service;

class MessageService extends Service {
  // 新增对话
  async add() {
    const {ctx} = this;
    const msg = ctx.args[0];

    // 查找是否有对应的聊天列表
    const messageList = await ctx.model.Message.find({
      chatId: msg.chatId
    });

    if (messageList.length) {
      let data = messageList[0];
      data.list.push(msg);
      return await ctx.model.Message.updateOne({
        chatId: msg.chatId
      }, data);
    } else {
      // 没有则新建
      let obj = {
        chatId: msg.chatId,
        list: [msg]
      };
      return await ctx.model.Message.create(obj);
    }
  }
}

module.exports = MessageService;
