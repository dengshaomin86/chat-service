'use strict';

const {Service} = require('egg');
const {pick} = require("lodash");
const {getFriendStatusText} = require('../core/statusText');

class FriendService extends Service {
  // 获取好友列表
  async list() {
    const {ctx} = this;
    const {userId} = ctx.session;

    // 好友列表
    const friend = await ctx.model.Friend.findOne({userId});
    const friendList = (friend && friend.list) || [];
    const users = await ctx.model.User.find({userId: {$in: friendList.map(item => item.userId)}});
    const list = users.map(item => pick(item, ["username", "userId", "avatar", "nickname"]));

    // 好友请求数量
    const requestList = (friend && friend.request) || [];
    const requestNum = requestList.filter(item => item.friendStatus === "3").length;

    return {
      requestNum,
      list,
    };
  }

  // 获取好友请求列表
  async requestList() {
    const {ctx} = this;
    const {userId} = ctx.session;

    const friend = await ctx.model.Friend.findOne({userId});
    const requestList = (friend && friend.request) || [];
    const requestNum = requestList.filter(item => item.friendStatus === "3").length;

    return {
      requestNum,
      list: requestList,
    };
  }

  // 添加好友
  async add() {
    const {ctx} = this;
    const {session, request, app} = ctx;
    const {username, userId} = session;
    const {toUsername, toUserId, msg} = request.body;

    function verify() {
      if (!toUsername) return "用户名有误";
      if (!toUserId) return "用户id有误";
      if (!msg) return "请输入留言";
      if (userId === toUserId) return "Sorry，您不能添加自己为好友";
      return false;
    }

    const verifyResult = verify();

    if (verifyResult) {
      return new Promise((resolve, reject) => {
        reject(verifyResult);
      });
    }

    // 校验是否已经是好友
    let friend = await ctx.model.Friend.findOne({userId});
    if (friend) {
      // 好友列表
      const list = (friend && friend.list) || [];
      if (list.find(item => item.userId === toUserId)) {
        return new Promise((resolve, reject) => {
          reject("你们已经是好友啦~");
        });
      }

      // 校验是否待确认状态
      // 好友请求状态列表
      let requestList = (friend && friend.request) || [];
      let requestObj = requestList.find(item => item.userId === toUserId);
      if (!["0", "4"].includes(requestObj.friendStatus)) {
        return new Promise((resolve, reject) => {
          reject(getFriendStatusText(requestObj.friendStatus));
        });
      }

      // 删除之前的记录
      let index = requestList.findIndex(item => item.userId === toUserId);
      if (index !== -1) requestList.splice(index, 1);

      // 添加记录-本人
      requestList.unshift({
        msg,
        userId: toUserId,
        username: toUsername,
        friendStatus: "2",
        friendStatusText: getFriendStatusText("2"),
      });
      friend.request = requestList;
      await ctx.model.Friend.updateOne({userId}, friend);
    } else {
      await ctx.model.Friend.create({
        userId,
        username,
        list: [],
        request: [
          {
            msg,
            userId: toUserId,
            username: toUsername,
            friendStatus: "2",
            friendStatusText: getFriendStatusText("2"),
          }
        ]
      });
    }

    // 添加记录-对方
    const friendOther = await ctx.model.Friend.findOne({userId: toUserId});
    if (friendOther) {
      let requestListOther = (friendOther && friendOther.request) || [];
      // 删除之前的记录
      let index = requestListOther.findIndex(item => item.userId === userId);
      if (index !== -1) requestListOther.splice(index, 1);
      requestListOther.unshift({
        msg,
        userId,
        username,
        friendStatus: "3",
        friendStatusText: getFriendStatusText("3"),
      });
      friendOther.request = requestListOther;
      await ctx.model.Friend.updateOne({userId: toUserId}, friendOther);
    } else {
      await ctx.model.Friend.create({
        userId: toUserId,
        username: toUsername,
        list: [],
        request: [
          {
            msg,
            userId,
            username,
            friendStatus: "3",
            friendStatusText: getFriendStatusText("3"),
          }
        ]
      });
    }

    // 推送消息
    let online = await ctx.model.Online.findOne({userId: toUserId});
    if (online && online.socketId) {
      app.io.of('/').sockets[online.socketId].emit("friendRelated", {
        type: "request",
        msg
      });
    }

    return "success";
  }

  // 同意好友请求
  async agree() {
    const {ctx} = this;
    const {session, request, app} = ctx;
    const {username, userId} = session;
    const {toUsername, toUserId} = request.body;

    function verify() {
      if (!toUsername) return "用户名有误";
      if (!toUserId) return "用户id有误";
      if (userId === toUserId) return "Sorry，您不能添加自己为好友";
      return false;
    }

    const verifyResult = verify();

    if (verifyResult) {
      return new Promise((resolve, reject) => {
        reject(verifyResult);
      });
    }

    let friend = await ctx.model.Friend.findOne({userId});
    let friendOther = await ctx.model.Friend.findOne({userId: toUserId});
    if (!friend || !friendOther) {
      return new Promise((resolve, reject) => {
        reject("用户数据有误");
      });
    }

    // 修改数据-本人
    let list = (friend && friend.list) || [];
    list.push({
      userId: toUserId,
      username: toUsername,
    });
    let requestList = (friend && friend.request) || [];
    requestList = requestList.map(item => {
      if (item.userId !== toUserId) return item;
      return {
        ...item,
        friendStatus: "1",
        friendStatusText: getFriendStatusText("1"),
      };
    });
    friend.list = list;
    friend.request = requestList;
    await ctx.model.Friend.updateOne({userId}, friend);

    // 修改数据-对方
    let listOther = (friendOther && friendOther.list) || [];
    listOther.push({
      userId,
      username,
    });
    let requestListOther = (friendOther && friendOther.request) || [];
    requestListOther = requestListOther.map(item => {
      if (item.userId !== userId) return item;
      return {
        ...item,
        friendStatus: "1",
        friendStatusText: getFriendStatusText("1"),
      };
    });
    friendOther.list = listOther;
    friendOther.request = requestListOther;
    await ctx.model.Friend.updateOne({userId: toUserId}, friendOther);

    // 推送消息
    let online = await ctx.model.Online.findOne({userId: toUserId});
    if (online && online.socketId) {
      app.io.of('/').sockets[online.socketId].emit("friendRelated", {
        type: "agree",
        msg: "friend-agree"
      });
    }

    return "success";
  }

  // 拒绝好友请求
  async refuse() {
    const {ctx} = this;
    const {session, request} = ctx;
    const {username, userId} = session;
    const {toUsername, toUserId} = request.body;

    function verify() {
      if (!toUsername) return "用户名有误";
      if (!toUserId) return "用户id有误";
      if (userId === toUserId) return "用户id有误";
      return false;
    }

    const verifyResult = verify();

    if (verifyResult) {
      return new Promise((resolve, reject) => {
        reject(verifyResult);
      });
    }

    let friend = await ctx.model.Friend.findOne({userId});
    let friendOther = await ctx.model.Friend.findOne({userId: toUserId});
    if (!friend || !friendOther) {
      return new Promise((resolve, reject) => {
        reject("用户数据有误");
      });
    }

    // 修改数据-本人
    let requestList = (friend && friend.request) || [];
    requestList = requestList.map(item => {
      if (item.userId !== toUserId) return item;
      return {
        ...item,
        friendStatus: "4",
        friendStatusText: getFriendStatusText("4"),
      };
    });
    friend.request = requestList;
    await ctx.model.Friend.updateOne({userId}, friend);

    // 修改数据-对方
    let requestListOther = (friendOther && friendOther.request) || [];
    requestListOther = requestListOther.map(item => {
      if (item.userId !== userId) return item;
      return {
        ...item,
        friendStatus: "4",
        friendStatusText: getFriendStatusText("4"),
      };
    });
    friendOther.request = requestListOther;
    await ctx.model.Friend.updateOne({userId: toUserId}, friendOther);

    return "success";
  }

  // 删除好友
  async remove() {
    const {ctx} = this;
    const {params, session, app} = ctx;
    const {userId} = session;
    const toUserId = params.id;

    function verify() {
      if (!toUserId) return "用户id有误";
      if (userId === toUserId) return "您不能删除自己";
      return false;
    }

    const verifyResult = verify();

    if (verifyResult) {
      return new Promise((resolve, reject) => {
        reject(verifyResult);
      });
    }

    async function delData(userId, toUserId) {
      const friend = await ctx.model.Friend.findOne({userId});
      let list = (friend && friend.list) || [];
      let requestList = (friend && friend.request) || [];
      let index = list.findIndex(item => item.userId === toUserId);
      if (index !== -1) list.splice(index, 1);
      requestList = requestList.map(item => {
        if (item.userId !== toUserId) return item;
        let friendStatus = "0";
        return {
          ...item,
          friendStatus,
          friendStatusText: getFriendStatusText(friendStatus),
        };
      });
      friend.list = list;
      friend.request = requestList;
      await ctx.model.Friend.updateOne({userId}, friend);
    }

    // 删除数据-本人
    await delData(userId, toUserId);

    // 删除数据-对方
    await delData(toUserId, userId);

    // 推送消息
    let online = await ctx.model.Online.findOne({userId: toUserId});
    if (online && online.socketId) {
      app.io.of('/').sockets[online.socketId].emit("friendRelated", {
        type: "remove",
        msg: "friend-remove"
      });
    }

    return "success";
  }
}

module.exports = FriendService;
