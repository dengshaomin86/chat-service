'use strict';

const Controller = require('../core/baseController');

class SingleController extends Controller {
  // 发起会话
  async send() {
    const {ctx} = this;
    await ctx.service.single.send().then(r => {
      this.success({
        data: r,
      })
    }).catch(err => {
      this.error({
        err,
      })
    });
  }

  // 聊天记录
  async record() {
    const {ctx} = this;
    await ctx.service.single.record().then(list => {
      this.success({
        list,
      })
    }).catch(err => {
      this.error({
        err,
      })
    });
  }
}

module.exports = SingleController;
