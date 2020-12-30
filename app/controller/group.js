'use strict';

const Controller = require('../core/baseController');

// 群聊
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
    await ctx.service.group.record().then(data => {
      this.success({
        ...data
      });
    }).catch(err => {
      this.error({
        message: err,
        err
      })
    });
  }

  // 群聊信息
  async info() {
    const {ctx} = this;
    await ctx.service.group.info().then(data => {
      this.success({
        data
      });
    }).catch(err => {
      this.error({
        message: err,
        err
      })
    });
  }

  // 修改群聊信息
  async update() {
    const {ctx} = this;
    await ctx.service.group.update().then(data => {
      this.success({
        message: "修改成功",
        data
      });
    }).catch(err => {
      this.error({
        message: err,
        err
      })
    });
  }

  // 移出群成员
  async remove() {
    const {ctx} = this;
    await ctx.service.group.remove().then(data => {
      this.success({
        message: "移出成功",
        data
      });
    }).catch(err => {
      this.error({
        message: err,
        err
      })
    });
  }

  // 添加群成员
  async append() {
    const {ctx} = this;
    await ctx.service.group.append().then(data => {
      this.success({
        message: "添加成功",
        data
      });
    }).catch(err => {
      this.error({
        message: err,
        err
      })
    });
  }

  // 退出群聊
  async quit() {
    const {ctx} = this;
    await ctx.service.group.quit().then(data => {
      this.success({
        message: "退出成功",
        data
      });
    }).catch(err => {
      this.error({
        message: err,
        err
      })
    });
  }

  // 解散群聊
  async disband() {
    const {ctx} = this;
    await ctx.service.group.disband().then(data => {
      this.success({
        message: "解散成功",
        data
      });
    }).catch(err => {
      this.error({
        message: err,
        err
      })
    });
  }
}

module.exports = GroupController;
