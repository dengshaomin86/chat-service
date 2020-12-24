'use strict';

const Controller = require('../core/baseController');

// 好友
class FriendController extends Controller {
  // 联系人列表
  async getContactList() {
    const {ctx} = this;
    let list = [];

    // 查找联系人列表
    const contact = await ctx.model.Contact.find({
      username: ctx.session.username
    });
    if (contact.length) list = contact[0].list;

    // 好友请求数量
    const reqList = await ctx.model.ContactRequest.find({
      username: ctx.session.username
    });
    let addReqNum = 0;
    if (reqList.length) addReqNum = reqList[0].list.filter(item => item.status === "0").length;

    this.success({
      addReqNum,
      list
    });
  }

  // 添加联系人
  async addContactFriend() {
    const {ctx} = this;
    await ctx.service.contactRequest.add().then(res => {
      this.success({
        message: "成功发送好友请求，等待对方同意",
        friendStatus: "2",
        friendStatusText: "待同意",
      });
    }).catch(err => {
      this.error({
        message: "添加失败",
        info: err
      });
    });
  }

  // 好友请求列表
  async getAddReqList() {
    const {ctx} = this;

    const reqList = await ctx.model.ContactRequest.find({
      username: ctx.session.username
    });

    let list = [];
    if (reqList.length) list = reqList[0].list;
    this.success({
      list
    });
  }

  // 同意好友请求
  async agreeAddFriendReq() {
    const {ctx} = this;
    await ctx.service.contactRequest.agree().then(res => {
      this.success({
        message: "你们现在可以聊天了",
        status: "1",
        statusText: "已同意",
      });
    }).catch(err => {
      this.error({
        message: "操作失败，请换个姿势再试",
        info: err
      });
    });
  }

  // 拒绝好友请求
  async refuseAddFriendReq() {
    const {ctx} = this;
    await ctx.service.contactRequest.refuse().then(res => {
      this.success({
        message: "你成功拒绝了一次骚扰",
        status: "2",
        statusText: "已拒绝",
      });
    }).catch(err => {
      this.error({
        message: "操作失败，请换个姿势再试",
        info: err
      });
    });
  }

  // 搜索用户
  async searchUser() {
    const {ctx} = this;
    const params = ctx.query;
    let userList = await ctx.model.User.find({
      usernameLowercase: params.keyword.toLowerCase()
    });

    let list = [];
    for (let item of userList) {
      let friendStatus = "0"; // 0 未添加；1 已添加；2 待同意
      let friendStatusText = "未添加";

      // 查找是否已经是好友
      let contact = await ctx.model.Contact.find({
        username: item.username
      });
      if (contact.length && contact[0].list.find(fri => fri.username === ctx.session.username)) {
        friendStatus = "1";
        friendStatusText = "已添加";
      }

      // 查找是否待回应
      let contactRequest = await ctx.model.ContactRequest.find({
        username: item.username
      });
      if (contactRequest.length && contactRequest[0].list.find(fri => fri.username === ctx.session.username && fri.friendStatus === "0")) {
        friendStatus = "2";
        friendStatusText = "待同意";
      }

      list.push({
        username: item.username,
        userId: item.userId,
        friendStatus,
        friendStatusText
      });
    }

    this.success({
      list
    });
  }
}

module.exports = FriendController;
