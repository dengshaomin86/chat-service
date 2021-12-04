'use strict';

const { Service } = require('egg');
const { pick } = require('lodash');
const { getFriendStatusText, admin, groupPublic } = require('../core/baseConfig');

class UserService extends Service {
  // 筛选用户信息
  static filterUserInfo(user) {
    return pick(user, ['username', 'userId', 'avatar', 'nickname', 'sex', 'hobby', 'signature', 'createDate']);
  }

  // 创建用户ID
  async createUserId(length = 6) {
    const { ctx } = this;
    length = Math.pow(10, length);
    let userId = '';
    let user = {};
    while (user) {
      userId = String(Math.floor(Math.random() * length));
      user = await ctx.model.User.findOne({ userId });
    }
    return String(userId);
  }

  // 创建管理员账号
  createAdmin() {
    return new Promise(async (resolve, reject) => {
      const { ctx } = this;
      const { params } = ctx;
      const { password } = params;
      const { username, userId } = admin;

      const user = await this.findUserByName(username);
      if (user) return reject('用户已存在');

      // 创建公共群聊
      await ctx.service.group.createPublic({ username, userId });

      // 创建用户
      const group = [groupPublic.groupId];
      await ctx.model.User.create({ username, password, userId, group });

      // 加入会话列表
      await ctx.service.chat.updateChat({
        username,
        userId,
        chatId: groupPublic.groupId,
        chatType: '2',
      });

      resolve('success');
    });
  }

  // 通过用户名查找用户
  async findUserByName(username) {
    const { ctx } = this;
    const users = await ctx.model.User.find();
    return users.find((item) => item.username.toLowerCase() === username.toLowerCase());
  }

  // 注册
  signUp() {
    return new Promise(async (resolve, reject) => {
      const { ctx } = this;
      const { username, password, cfPassword } = ctx.request.body;
      const user = await this.findUserByName(username);

      if (user) return reject('用户已存在');
      if (password !== cfPassword) return reject('密码不一致，请重新输入');

      // 创建用户
      const userId = await this.createUserId();
      const group = [groupPublic.groupId];
      const result = await ctx.model.User.create({ username, password, userId, group });

      // 加入公共群聊
      await ctx.service.group.appendGroup({
        groupId: groupPublic.groupId,
        username,
        userId,
      });

      // 加入会话列表
      await ctx.service.chat.updateChat({
        username,
        userId,
        chatId: groupPublic.groupId,
        chatType: '2',
      });

      resolve(UserService.filterUserInfo(result));
    });
  }

  // 登录
  signIn() {
    return new Promise(async (resolve, reject) => {
      const { ctx } = this;
      const { session } = ctx;
      const { username, password } = ctx.request.body;
      let user = await this.findUserByName(username);

      if (!user) return reject('用户不存在');
      if (password !== user.password) return reject('密码错误');

      session.username = user.username;
      session.userId = user.userId;
      resolve(UserService.filterUserInfo(user));
    });
  }

  // 退出登录
  async signOut() {
    const { ctx } = this;
    await ctx.service.online.remove();
    ctx.session = {};
    return 'success';
  }

  // 获取用户头像
  async avatar(userId) {
    const { ctx } = this;
    const user = await ctx.model.User.findOne({ userId });
    return user.avatar;
  }

  // 获取用户信息
  info(friendUserId) {
    return new Promise(async (resolve, reject) => {
      const { ctx } = this;
      const { session, params } = ctx;
      const { userId } = session;

      friendUserId = friendUserId || params.id;
      let friendUser = await ctx.model.User.findOne({ userId: friendUserId });
      if (!friendUser) return reject('用户不存在');

      let info = pick(friendUser, ['username', 'userId', 'avatar', 'nickname', 'sex', 'hobby', 'signature', 'createDate']);

      // 获取好友状态
      let friendStatus = '0';
      if (friendUserId !== userId) {
        let friendRequest = await ctx.model.FriendRequest.findOne({ userId, friendUserId });
        if (friendRequest) friendStatus = friendRequest.friendStatus;
      }
      let friendStatusText = getFriendStatusText(friendStatus);

      resolve({
        ...info,
        friendStatus,
        friendStatusText,
      });
    });
  }

  // 搜索用户
  search() {
    return new Promise(async (resolve, reject) => {
      const { ctx } = this;
      const { session, query } = ctx;
      const { userId } = session;
      const username = query.keyword;

      if (!username) return reject('请输入关键字');

      let user = await this.findUserByName(username);
      if (!user) return resolve([]);

      let info = pick(user, ['username', 'userId', 'avatar', 'nickname', 'sex', 'hobby', 'signature', 'createDate']);

      // 获取好友状态
      let friendStatus = '0';
      if (userId !== info.userId) {
        const friendRequest = await ctx.model.FriendRequest.findOne({ userId, friendUserId: info.userId });
        if (friendRequest) friendStatus = friendRequest.friendStatus;
      }
      let friendStatusText = getFriendStatusText(friendStatus);

      resolve([
        {
          ...info,
          friendStatus,
          friendStatusText,
        },
      ]);
    });
  }

  // 修改用户信息
  update() {
    return new Promise(async (resolve, reject) => {
      const { ctx } = this;
      const info = ctx.request.body;
      const { username, userId } = ctx.session;

      if (typeof info !== 'object') return reject('参数有误');

      // 筛选可修改数据
      const editable = ['avatar', 'nickname', 'sex', 'hobby', 'signature'];
      let newInfo = {};
      for (let key in info) {
        if (editable.includes(key)) newInfo[key] = info[key];
      }

      let result = await ctx.model.User.updateOne({ userId }, newInfo);
      if (!result.n) return reject('修改失败');

      const user = await ctx.service.user.info(userId);
      resolve(user);
    });
  }
}

module.exports = UserService;
