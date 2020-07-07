'use strict';

const Service = require('egg').Service;
const pick = require("lodash").pick;

// 创建用户 ID
async function createID(ctx) {
  let userId = String(Math.floor(Math.random() * 1000000));
  let users = await ctx.model.User.find({
    userId
  });
  while (users.length) {
    userId = String(Math.floor(Math.random() * 1000000));
    users = await ctx.model.User.find({
      userId
    });
  }
  return String(userId);
}

class UserService extends Service {
  // 新增用户
  async add(data) {
    const {ctx} = this;
    const userId = await createID(ctx);
    let user = {
      username: data.username,
      usernameLowercase: data.username,
      password: data.password,
      userId
    };
    return await ctx.model.User.create(user);
  }

  async getInfo() {
    const {ctx} = this;
    const params = ctx.request.body;

    if (!ctx.session.username) {
      return new Promise((resolve, reject) => {
        reject("您已掉线，请重新登录");
      });
    }

    let username = params.username || ctx.session.username;
    let list = await ctx.model.User.find({
      username
    });

    if (!list.length) {
      return new Promise((resolve, reject) => {
        reject("用户不存在");
      });
    }

    let obj = pick(list[0], ["username", "userId", "avatar", "nickname", "sex", "hobby", "createDate"]);

    let status = "0"; // 0 未添加；1 已添加；2 待回应
    let statusText = "未添加"; // 0 未添加；1 已添加；2 待回应

    if (params.username) {
      // 查找是否已经是好友
      let contact = await ctx.model.Contact.find({
        username: params.username
      });
      if (contact.length && contact[0].list.find(fri => fri.username === ctx.session.username)) {
        status = "1";
        statusText = "已添加";
      }

      // 查找是否待回应
      let contactRequest = await ctx.model.ContactRequest.find({
        username: params.username
      });
      if (contactRequest.length && contactRequest[0].list.find(fri => fri.username === ctx.session.username && fri.status === "0")) {
        status = "2";
        statusText = "待回应";
      }

      obj.status = status;
      obj.statusText = statusText;
    }

    return obj;
  }

  async update() {
    const {ctx} = this;
    const info = ctx.request.body;
    if (ctx.session.username !== info.username) {
      return new Promise((resolve, reject) => {
        reject("无权限修改");
      });
    }
    return await ctx.model.User.updateOne({
      username: info.username
    }, {
      avatar: info.avatar,
      nickname: info.nickname,
      sex: info.sex,
      hobby: info.hobby
    });
  }

  async signIn() {
    const {ctx} = this;
    const info = ctx.request.body;
    let user = await ctx.model.User.find({
      username: info.username
    });

    if (!user.length) {
      return new Promise((resolve, reject) => {
        reject("用户不存在");
      });
    }

    user = user[0];

    if (info.password !== user.password) {
      return new Promise((resolve, reject) => {
        reject("密码错误");
      });
    }

    return new Promise((resolve, reject) => {
      ctx.session.username = user.username;
      ctx.session.userId = user.userId;
      resolve(pick(user, ["username", "avatar", "nickname"]));
    });
  }
}

module.exports = UserService;
