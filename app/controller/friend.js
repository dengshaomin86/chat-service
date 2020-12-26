'use strict';

const Controller = require('../core/baseController');
const {getFriendStatusText} = require('../core/baseConfig');

// 好友
class FriendController extends Controller {
  // 获取好友列表
  async list() {
    const {ctx} = this;
    await ctx.service.friend.list().then(res => {
      this.success({
        ...res
      });
    }).catch(err => {
      this.error({
        info: err
      });
    });
  }

  // 获取好友请求列表
  async requestList() {
    const {ctx} = this;
    await ctx.service.friend.requestList().then(res => {
      this.success({
        ...res
      });
    }).catch(err => {
      this.error({
        info: err
      });
    });
  }

  // 添加好友
  async add() {
    const {ctx} = this;
    await ctx.service.friend.add().then(res => {
      this.success({
        message: "成功发送好友请求，等待对方同意",
        friendStatus: "2",
        friendStatusText: getFriendStatusText("2"),
      });
    }).catch(err => {
      this.error({
        message: err || "添加失败",
        info: err
      });
    });
  }

  // 同意好友请求
  async agree() {
    const {ctx} = this;
    await ctx.service.friend.agree().then(res => {
      this.success({
        message: "你们成为了好友",
        friendStatus: "1",
        friendStatusText: getFriendStatusText("1"),
      });
    }).catch(err => {
      this.error({
        message: "操作失败",
        info: err
      });
    });
  }

  // 拒绝好友请求
  async refuse() {
    const {ctx} = this;
    await ctx.service.friend.refuse().then(res => {
      this.success({
        message: "你拒绝了他（她）",
        friendStatus: "4",
        friendStatusText: getFriendStatusText("4"),
      });
    }).catch(err => {
      this.error({
        message: "操作失败",
        info: err
      });
    });
  }

  // 删除好友
  async remove() {
    const {ctx} = this;
    await ctx.service.friend.remove().then(r => {
      this.success({
        message: "删除成功"
      });
    }).catch(err => {
      this.success({
        message: "删除失败",
        err
      });
    });
  }
}

module.exports = FriendController;
