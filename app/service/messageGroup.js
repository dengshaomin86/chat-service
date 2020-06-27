'use strict';

const Service = require('egg').Service;

class MessageGroupService extends Service {
  // 新增对话
  async add(msgObj) {
    const {ctx} = this;
    return await ctx.model.MessageGroup.create(msgObj);
  }
}

module.exports = MessageGroupService;
