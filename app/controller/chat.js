'use strict';

const Controller = require('../core/baseController');

class ChatController extends Controller {
  // 聊天列表
  async list() {
    const {ctx} = this;
    await ctx.service.chat.list().then(list => {
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

  // 删除会话
  async remove() {
    const {ctx} = this;
    await ctx.service.chat.remove().then(res => {
      this.success({
        message: "删除成功",
      });
    }).catch(err => {
      this.error({
        message: "删除失败",
        info: err
      });
    });
  }
}

module.exports = ChatController;
