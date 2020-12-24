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

  async getInfo(username) {
    const {ctx} = this;
    const params = ctx.request.body;
    username = username || params.username;

    if (!username) {
      return new Promise((resolve, reject) => {
        reject("用户不存在");
      });
    }

    let list = await ctx.model.User.find({
      username
    });

    if (!list.length) {
      return new Promise((resolve, reject) => {
        reject("用户不存在");
      });
    }

    let obj = pick(list[0], ["username", "userId", "avatar", "nickname", "sex", "hobby", "signature", "createDate"]);

    let friendStatus = "0"; // 0 未添加；1 已添加；2 待同意
    let friendStatusText = "未添加"; // 0 未添加；1 已添加；2 待同意

    if (username !== ctx.session.username) {
      // 查找是否已经是好友
      let contact = await ctx.model.Contact.find({
        username
      });
      if (contact.length && contact[0].list.find(fri => fri.username === ctx.session.username)) {
        friendStatus = "1";
        friendStatusText = "好友";
      }

      // 查找是否待回应
      let contactRequest = await ctx.model.ContactRequest.find({
        username
      });
      if (contactRequest.length && contactRequest[0].list.find(fri => fri.username === ctx.session.username && fri.status === "0")) {
        friendStatus = "2";
        friendStatusText = "待同意";
      }
    }

    return {
      ...obj,
      friendStatus,
      friendStatusText
    };
  }

  async update() {
    const {ctx} = this;
    const info = ctx.request.body;
    const {username} = ctx.session;

    if (typeof info !== "object") {
      return new Promise((resolve, reject) => {
        reject("参数有误");
      });
    }

    // 筛选可修改数据
    const editable = ["avatar", "nickname", "sex", "hobby", "signature"];
    let newInfo = {};
    for (let key in info) {
      if (editable.includes(key)) newInfo[key] = info[key];
    }

    let result = await ctx.model.User.updateOne({
      username
    }, newInfo);

    return new Promise(async (resolve, reject) => {
      if (result.n === 0) {
        reject("修改失败");
      } else {
        let user = await ctx.service.user.getInfo(username);
        resolve(user);
      }
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

  async getAvatar(userId) {
    const {ctx} = this;
    let user = await ctx.model.User.find({
      userId
    });

    if (!user.length) {
      return new Promise((resolve, reject) => {
        reject("用户不存在");
      });
    }

    return new Promise((resolve, reject) => {
      resolve(user[0].avatar);
    });
  }
}

module.exports = UserService;
