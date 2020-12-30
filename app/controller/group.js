'use strict';

const Controller = require('../core/baseController');

// 群组
class GroupController extends Controller {
  // 列表
  async list() {
    const {ctx} = this;
  }

  // 创建
  async create() {
    const {ctx} = this;
    await ctx.service.group.create().then(data => {
      this.success({
        message: "创建成功",
        data
      });
    }).catch(err => {
      this.error({
        err
      })
    });
  }

  // 消息记录
  async record() {
    const {ctx} = this;
    await ctx.service.group.record().then(list => {
      this.success({
        list
      });
    }).catch(err => {
      this.error({
        err
      })
    });
  }
}

module.exports = GroupController;
