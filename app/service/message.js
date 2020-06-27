'use strict';

const Service = require('egg').Service;

class MessageService extends Service {
  // 新增对话
  async add(msgObj) {
    const {ctx} = this;
    return await ctx.model.Message.create(msgObj);
  }
}

module.exports = MessageService;
