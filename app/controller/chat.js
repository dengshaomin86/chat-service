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

  // 新增聊天列表
  async add() {
    const {ctx} = this;
    await ctx.service.chat.add().then(res => {
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
}

module.exports = ChatController;
