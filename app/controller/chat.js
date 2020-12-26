'use strict';

const Controller = require('../core/baseController');

class ChatController extends Controller {
  // 新增聊天列表
  async addChatList() {
    const {ctx} = this;
    await ctx.service.chatList.add().then(res => {
      this.success({
        message: "创建成功",
        data: res
      });
    }).catch(err => {
      this.error({
        message: "创建失败",
        info: err
      });
    });
  }

  // 聊天列表
  async getChatList() {
    const {ctx} = this;
    await ctx.service.chatList.getChatList().then(list => {
      this.success({
        list
      });
    }).catch(err => {
      this.error({
        message: "获取列表失败",
        info: err
      });
    });
  }

  // 对话列表
  async getMsgList() {
    const {ctx} = this;
    await ctx.service.message.getMsgList().then(list => {
      this.success({
        list
      });
    }).catch(err => {
      this.error({
        message: "获取聊天记录失败",
        info: err
      });
    });
  }
}

module.exports = ChatController;
