'use strict';

const {Service} = require('egg');
const {pick} = require("lodash");
const {getFriendStatusText, createSingleId} = require('../core/baseConfig');

class FriendService extends Service {
  // 获取好友列表
  async list() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {userId} = ctx.session;

      // 好友列表
      const friend = await ctx.model.Friend.find({userId});

      if (!friend) {
        resolve({
          list: []
        });
        return;
      }

      let list = [];
      for (let idx in friend) {
        let item = friend[idx];
        let user = await ctx.model.User.findOne({userId: item.friendUserId});
        list.push({
          ...pick(user, ["username", "userId", "avatar", "nickname"]),
        });
      }

      resolve({
        list
      });
    });
  }

  // 获取好友请求列表
  async requestList() {
    const {ctx} = this;
    const {userId} = ctx.session;

    let friendRequest = await ctx.model.FriendRequest.find({userId, friendStatus: {$ne: "0"}});
    let list = [];
    for (let idx in friendRequest) {
      let item = friendRequest[idx];
      let user = await ctx.model.User.findOne({userId: item.friendUserId});
      let obj = pick(item, ["friendUserId", "friendStatus", "msg"]);
      list.push({
        ...obj,
        friendUsername: user.username,
        friendStatusText: getFriendStatusText(item.friendStatus),
      });
    }
    const requestNum = friendRequest.filter(item => item.friendStatus === "3").length;

    return {
      requestNum,
      list,
    };
  }

  // 添加好友
  async add() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, request, app} = ctx;
      const {username, userId} = session;
      const {friendUserId, msg} = request.body;
      const nsp = app.io.of('/');

      function verify() {
        if (!friendUserId) return "用户id有误";
        if (!msg) return "请输入留言";
        if (userId === friendUserId) return "Sorry，您不能添加自己为好友";
        return false;
      }

      const verifyResult = verify();

      if (verifyResult) return reject(verifyResult);

      // 校验是否已经是好友
      let friend = await ctx.model.Friend.findOne({userId, friendUserId});
      if (friend) {
        reject("你们已经是好友啦~");
        return;
      }

      // 校验好友请求状态
      let friendRequest = await ctx.model.FriendRequest.findOne({userId, friendUserId});
      if (friendRequest && ["1", "2", "3"].includes(friendRequest.friendStatus)) {
        reject(getFriendStatusText(friendRequest.friendStatus));
        return;
      }

      // 添加或修改好友请求
      await this.setFriendRequest(userId, friendUserId, "2", msg);
      await this.setFriendRequest(friendUserId, userId, "3", msg);

      // 推送消息
      let online = await ctx.model.Online.findOne({userId: friendUserId});
      if (online && online.socketId && nsp.sockets[online.socketId]) {
        nsp.sockets[online.socketId].emit("friendRelated", {
          type: "request",
          msg
        });
      }

      resolve("success");
    });
  }

  // 同意好友请求
  async agree() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, request, app} = ctx;
      const {username, userId} = session;
      const {friendUserId} = request.body;
      const nsp = app.io.of('/');

      if (!friendUserId) return reject("用户id有误");

      const friendRequest = await ctx.model.FriendRequest.findOne({userId, friendUserId});

      if (!friendRequest) return reject("好友申请不存在");

      if (friendRequest.friendStatus !== "3") return reject("您无法同意好友申请");

      // 修改好友请求状态
      await this.setFriendRequest(userId, friendUserId, "1");
      await this.setFriendRequest(friendUserId, userId, "1");

      // 修改好友列表
      await this.setFriend(userId, friendUserId);
      await this.setFriend(friendUserId, userId);

      // 推送消息
      let online = await ctx.model.Online.findOne({userId: friendUserId});
      if (online && online.socketId && nsp.sockets[online.socketId]) {
        nsp.sockets[online.socketId].emit("friendRelated", {
          type: "agree",
          msg: "friend-agree"
        });
      }

      resolve("success");
    });
  }

  // 拒绝好友请求
  async refuse() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, request} = ctx;
      const {username, userId} = session;
      const {friendUserId} = request.body;

      if (!friendUserId) return reject("用户id有误");

      const friendRequest = await ctx.model.FriendRequest.findOne({userId, friendUserId});

      if (!friendRequest) return reject("好友申请不存在");

      if (friendRequest.friendStatus !== "3") return reject("您无法拒绝好友申请");

      // 修改好友请求状态
      await this.setFriendRequest(userId, friendUserId, "4");
      await this.setFriendRequest(friendUserId, userId, "4");

      resolve("success");
    });
  }

  // 删除好友
  async remove() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {params, session} = ctx;
      const {userId} = session;
      const friendUserId = params.id;

      if (!friendUserId) return reject("用户id有误");

      // 删除好友
      await ctx.model.Friend.deleteOne({userId, friendUserId});

      // 重置好友请求状态
      await this.setFriendRequest(userId, friendUserId, "0");

      // 删除会话
      const chatId = createSingleId(userId, friendUserId);
      await ctx.model.Chat.deleteOne({userId, chatId});

      resolve({
        chatId
      });
    });
  }

  // 添加或修改好友请求状态
  async setFriendRequest(userId, friendUserId, friendStatus, msg) {
    const {ctx} = this;
    let data = {
      userId,
      friendUserId,
      friendStatus,
    };
    if (["2", "3"].includes(friendStatus) && msg) {
      data.msg = msg;
    }
    return await ctx.model.FriendRequest.updateOne({userId, friendUserId}, data, {upsert: true});
  }

  // 修改好友列表
  async setFriend(userId, friendUserId) {
    const {ctx} = this;
    return await ctx.model.Friend.updateOne({userId, friendUserId}, {userId, friendUserId}, {upsert: true});
  }
}

module.exports = FriendService;
