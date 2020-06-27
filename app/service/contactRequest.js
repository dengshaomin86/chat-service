'use strict';

const Service = require('egg').Service;

// 好友请求
class ContactRequestService extends Service {
  // 新增好友请求
  async add() {
    const {ctx} = this;
    const params = ctx.query;

    if (ctx.session.username.toLowerCase() === params.username.toLowerCase()) {
      return new Promise((resolve, reject) => {
        reject("sorry，不能添加自己为好友");
      });
    }

    const reqList = await ctx.model.ContactRequest.find({
      username: params.username
    });

    // status 状态值：0 待回应；1 已同意；2 已拒绝
    const reqObj = {
      username: ctx.session.username,
      userId: ctx.session.userId,
      msg: params.msg,
      status: "0",
      statusText: "待回应",
    };

    if (reqList.length) {
      let data = reqList[0];
      let record = data.list.find(item => item.username === ctx.session.username && item.status !== "2");
      if (record) {
        return new Promise((resolve, reject) => {
          switch (record.status) {
            case "0":
              resolve("请耐心等待对方回应");
              break;
            case "1":
              reject("你们已经是好友了");
              break;
            default:
              reject("数据有误");
              break;
          }
        });
      }

      // 不是好友则新增一条好友请求
      data.list.push(reqObj);
      return await ctx.model.ContactRequest.updateOne({
        username: params.username
      }, data);
    }

    // 没有当前用户的记录则新增一条
    let obj = {
      username: params.username,
      userId: params.userId,
      list: [reqObj]
    };
    return await ctx.model.ContactRequest.create(obj);
  }

  // 同意好友请求
  async agree() {
    const {ctx} = this;
    const params = ctx.query;

    const reqList = await ctx.model.ContactRequest.find({
      username: ctx.session.username
    });

    if (!reqList.length) {
      return new Promise((resolve, reject) => {
        reject("记录不存在");
      });
    }

    let data = reqList[0];
    let record = data.list.find(item => item.username === params.username && item.status === "0");
    if (!record) {
      return new Promise((resolve, reject) => {
        reject("记录不存在");
      });
    }

    // 给两人增加关系表
    await ctx.service.contact.add().then(res => {
      console.log("给两人增加关系表成功");
    }).catch(err => {
      return new Promise((resolve, reject) => {
        reject("给两人增加关系表失败");
      });
    });

    // 修改数据状态
    record.status = "1";
    record.statusText = "已同意";

    data.list.splice(data.list.findIndex(item => item.username === params.username), 1, record);

    return await ctx.model.ContactRequest.updateOne({
      username: ctx.session.username
    }, data);
  }

  // 拒绝好友请求
  async refuse() {
    const {ctx} = this;
    const params = ctx.query;

    const reqList = await ctx.model.ContactRequest.find({
      username: ctx.session.username
    });

    if (!reqList.length) {
      return new Promise((resolve, reject) => {
        reject("记录不存在");
      });
    }

    let data = reqList[0];
    let record = data.list.find(item => item.username === params.username);
    if (!record) {
      return new Promise((resolve, reject) => {
        reject("记录不存在");
      });
    }

    if (record.status !== "0") {
      return new Promise((resolve, reject) => {
        reject("无法重复操作");
      });
    }

    record.status = "2";
    record.statusText = "已拒绝";

    data.list.splice(data.list.findIndex(item => item.username === params.username), 1, record);

    return await ctx.model.ContactRequest.updateOne({
      username: ctx.session.username
    }, data);
  }
}

module.exports = ContactRequestService;
