'use strict';

const {Service} = require('egg');
const {pick} = require("lodash");
const {getFriendStatusText, admin, groupPublic} = require('../core/baseConfig');

class UserService extends Service {
  // 筛选用户信息
  static filterUserInfo(user) {
    return pick(user, ["username", "userId", "avatar", "nickname", "sex", "hobby", "signature", "createDate"]);
  }

  // 创建用户ID
  async createUserId(length = 6) {
    const {ctx} = this;
    length = Math.pow(10, length);
    let userId = "";
    let user = {};
    while (user) {
      userId = String(Math.floor(Math.random() * length));
      user = await ctx.model.User.findOne({userId});
    }
    return String(userId);
  }

  // 创建管理员账号
  createAdmin() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {params} = ctx;
      const {password} = params;
      const {username, userId} = admin;

      const user = await this.findUserByName(username);

      function verify() {
        if (user) return "用户已存在";
        return false;
      }

      let verifyResult = verify();
      if (verifyResult) {
        reject(verifyResult);
        return;
      }

      // 创建公共群聊
      await ctx.service.group.createPublic({username, userId});

      // 创建用户
      const group = [groupPublic.groupId];
      await ctx.model.User.create({username, password, userId, group});

      // 加入会话列表
      await ctx.service.chat.appendChat({
        username,
        userId,
        chatId: groupPublic.groupId,
        chatType: "2"
      });

      resolve("success");
    });
  }

  // 通过用户名查找用户
  async findUserByName(username) {
    const {ctx} = this;
    const users = await ctx.model.User.find();
    return users.find(item => item.username.toLowerCase() === username.toLowerCase());
  }

  // 注册
  signUp() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {username, password, cfPassword} = ctx.request.body;

      const user = await this.findUserByName(username);

      function verify() {
        if (user) return "用户已存在";
        if (password !== cfPassword) return "密码不一致，请重新输入";
        return false;
      }

      let verifyResult = verify();
      if (verifyResult) {
        reject(verifyResult);
        return;
      }

      // 创建用户
      const userId = await this.createUserId();
      const group = [groupPublic.groupId];
      const result = await ctx.model.User.create({username, password, userId, group});

      // 加入公共群聊
      await ctx.service.group.appendGroup({
        groupId: groupPublic.groupId,
        username,
        userId,
      });

      // 加入会话列表
      await ctx.service.chat.appendChat({
        username,
        userId,
        chatId: groupPublic.groupId,
        chatType: "2"
      });

      resolve(UserService.filterUserInfo(result));
    });
  }

  // 登录
  signIn() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session} = ctx;
      const {username, password} = ctx.request.body;
      let user = await this.findUserByName(username);

      function verify() {
        if (!user) return "用户不存在";
        if (password !== user.password) return "密码错误";
        return false;
      }

      const verifyResult = verify();
      if (verifyResult) {
        reject(verifyResult);
        return;
      }

      session.username = user.username;
      session.userId = user.userId;
      resolve(UserService.filterUserInfo(user));
    });
  }

  // 退出登录
  async signOut() {
    const {ctx} = this;
    await ctx.service.online.remove();
    ctx.session = {};
    return "success";
  }

  // 获取用户头像
  async avatar(userId) {
    const {ctx} = this;
    const user = await ctx.model.User.findOne({userId});
    return user.avatar;
  }

  // 获取用户信息
  info(userId) {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, params} = ctx;

      userId = userId || params.id;
      let user = await ctx.model.User.findOne({userId});
      if (!user) {
        reject("用户不存在");
        return;
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

      resolve({
        ...info,
        friendStatus,
        friendStatusText
      });
    });
  }

  // 搜索用户
  search() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, query} = ctx;
      const {userId} = session;
      const username = query.keyword;

      if (!username) {
        reject("请输入关键字");
        return;
      }

      let user = await this.findUserByName(username);
      if (!user) {
        resolve([]);
        return;
      }

      let info = pick(user, ["username", "userId", "avatar", "nickname", "sex", "hobby", "signature", "createDate"]);

      // 获取好友状态
      let friendStatus = "0";
      if (userId !== info.userId) {
        let friend = await ctx.model.Friend.findOne({userId});
        let requestList = (friend && friend.request) || [];
        let requestObj = requestList.find(fri => fri.userId === info.userId);
        if (requestObj) friendStatus = requestObj.friendStatus;
      }
      let friendStatusText = getFriendStatusText(friendStatus);

      resolve([{
        ...info,
        friendStatus,
        friendStatusText
      }]);
    });
  }

  // 修改用户信息
  update() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const info = ctx.request.body;
      const {username, userId} = ctx.session;

      if (typeof info !== "object") {
        reject("参数有误");
        return;
      }

      // 筛选可修改数据
      const editable = ["avatar", "nickname", "sex", "hobby", "signature"];
      let newInfo = {};
      for (let key in info) {
        if (editable.includes(key)) newInfo[key] = info[key];
      }

      let result = await ctx.model.User.updateOne({userId}, newInfo);
      if (result.n === 0) {
        reject("修改失败");
        return;
      }

      const user = await ctx.service.user.info(userId);
      resolve(user);
    });
  }
}

module.exports = UserService;
