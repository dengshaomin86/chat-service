'use strict';

const {Service} = require('egg');
const {pick} = require("lodash");
const {getFriendStatusText} = require('../core/statusText');

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

  // 获取用户信息
  async info(userId) {
    const {ctx} = this;
    const {session, params} = ctx;

    userId = userId || params.id;
    let user = await ctx.model.User.findOne({userId});
    if (!user) {
      return new Promise((resolve, reject) => {
        reject("用户不存在");
      });
    }

    let info = pick(user, ["username", "userId", "avatar", "nickname", "sex", "hobby", "signature", "createDate"]);

    // 获取好友状态
    let friendStatus = "0";
    if (userId !== session.userId) {
      let friend = await ctx.model.Friend.findOne({userId: session.userId});
      let requestList = (friend && friend.request) || [];
      let requestObj = requestList.find(fri => fri.userId === userId);
      if (requestObj) friendStatus = requestObj.friendStatus;
    }
    let friendStatusText = getFriendStatusText(friendStatus);

    return {
      ...info,
      friendStatus,
      friendStatusText
    };
  }

  // 修改用户信息
  async update() {
    const {ctx} = this;
    const info = ctx.request.body;
    const {username, userId} = ctx.session;

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
        let user = await ctx.service.user.info(userId);
        resolve(user);
      }
    });
  }

  // 登录
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
      resolve(pick(user, ["username", "userId", "avatar", "nickname"]));
    });
  }

  // 获取用户头像
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
