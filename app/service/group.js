'use strict';

const {Service} = require('egg');
const {pick} = require('lodash');

const {groupPublic, storeMsgKey, getGroupName} = require("../core/baseConfig");

class GroupService extends Service {
  // 创建群聊ID
  static createGroupId(userId) {
    return `g${new Date().getTime()}${userId}`;
  }

  // 创建公共群聊
  async createPublic({username, userId}) {
    const {ctx} = this;

    // 创建群聊
    await ctx.model.Group.create({
      ...groupPublic,
      master: userId,
      members: [{username, userId}],
    });

    // 增加一条默认消息内容
    await ctx.model.RecordGroup.create({
      groupId: groupPublic.groupId,
      msgType: "1",
      msg: groupPublic.msg,
      fromUsername: username,
      fromUserId: userId,
      createTime: new Date().getTime(),
    });

    return "success";
  }

  // 创建群聊
  async create() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, request, app} = ctx;
      const {username, userId} = session;
      const {body} = request;
      let {members} = body;
      const nsp = app.io.of('/');

      // 入参校验
      if (!members || !members.length) return reject("请勾选群成员");

      // 校验成员是否存在

      // 校验双方是否都是好友（对方已删除好友时需要对方同意）

      // 创建群聊
      members.unshift({username, userId});
      const res = await ctx.model.Group.create({
        groupName: null,
        groupId: GroupService.createGroupId(userId),
        master: userId,
        members,
      });

      // 创建群聊信息
      await ctx.model.RecordGroup.create({
        groupId: res.groupId,
        msgType: "1",
        msg: "欢迎加入群聊",
        fromUsername: username,
        fromUserId: userId,
        createTime: new Date().getTime(),
      });

      // 加入所有成员的会话列表，并推送消息刷新会话列表
      for (let idx in members) {
        let item = members[idx];

        // 加入用户信息
        let user = await ctx.model.User.findOne({userId: item.userId});
        let {group} = user;
        group = [...new Set([...group, res.groupId])];
        await ctx.model.User.updateOne({userId: item.userId}, {group});

        // 加入会话列表
        await ctx.service.chat.updateChat({
          chatId: res.groupId,
          chatType: "2",
          username: item.username,
          userId: item.userId
        });

        // 推送消息
        let online = await ctx.model.Online.findOne({userId: item.userId});
        if (online && online.socketId && nsp.sockets[online.socketId]) {
          nsp.sockets[online.socketId].emit("group", {
            type: "joinRoom",
            groupId: res.groupId
          });
        }
      }

      resolve(pick(res, ["groupName", "groupId", "master", "members", "avatar", "announcement"]));
    });
  }

  // 加入群聊
  appendGroup({groupId, username, userId}) {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;

      let group = await ctx.model.Group.findOne({groupId});
      if (!group) {
        reject("群聊不存在");
        return;
      }

      let {members} = group;
      if (members.find(item => item.userId === userId)) {
        reject("已经在群聊中了");
        return;
      }

      members.push({username, userId});
      group.members = members;
      await ctx.model.Group.updateOne({groupId}, group);

      resolve("success");
    });
  }

  // 消息记录
  async record() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, params} = ctx;
      const {userId} = session;
      const {groupId} = params;
      const group = await ctx.model.Group.findOne({groupId});
      if (!group) return reject("群聊不存在");

      const {groupName, avatar, members, disband} = group;
      const member = members.find(item => item.userId === userId);
      const joinTime = member.joinTime || 0;
      const createTime = member.leaveTime || new Date().getTime();
      const record = await ctx.model.RecordGroup.find({groupId, createTime: {$gt: joinTime, $lt: createTime}});
      if (!record || !record.length) return resolve({list: [], enable: !disband});

      // 处理消息内容
      let list = [];
      for (let idx  in record) {
        let item = record[idx];
        let {fromUserId} = item;
        let fromUserAvatar = await ctx.service.user.avatar(fromUserId);
        list.push({
          ...pick(item, storeMsgKey),
          fromUserAvatar,
          chatType: "2",
          chatId: groupId,
          chatName: getGroupName(groupName, members),
          chatAvatar: avatar,
        });
      }
      resolve({list, enable: !disband});
    });
  }

  // 群聊信息
  async info() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, params} = ctx;
      const {groupId} = params;
      const group = await ctx.model.Group.findOne({groupId});
      if (!group) return reject("群聊不存在");
      if (group.disband) return reject("此群聊已解散");
      resolve(this.handlerGroupInfo(group));
    });
  }

  // 处理群聊返回的数据
  async handlerGroupInfo(group) {
    const {ctx} = this;
    const {groupName, members} = group;

    // 遍历群成员拿到用户信息
    let list = [];
    for (let idx in members) {
      let member = members[idx];
      if (member.leaveTime) continue;
      let user = await ctx.model.User.findOne({userId: member.userId});
      if (!user) continue;
      list.push(pick(user, ["username", "userId", "avatar"]));
    }

    return {
      ...pick(group, ["groupId", "master", "avatar", "announcement"]),
      groupName: getGroupName(groupName, members),
      members: list,
    };
  }

  // 修改群聊信息
  async update() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, request} = ctx;
      const {groupId, groupName, announcement} = request.body;
      const group = await ctx.model.Group.findOne({groupId});
      if (!group) return reject("群聊不存在");

      let modify = {};
      if (groupName) modify.groupName = groupName;
      if (announcement) modify.announcement = announcement;
      let res = await ctx.model.Group.findOneAndUpdate({groupId}, modify, {new: true});
      resolve(this.handlerGroupInfo(res));
    });
  }

  // 移出群成员
  async remove() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, request, app} = ctx;
      const {userId} = session;
      const {groupId, memberId} = request.body;
      const nsp = app.io.of('/');

      const group = await ctx.model.Group.findOne({groupId});
      if (!group) return reject("群聊不存在");
      let {master, members} = group;
      if (master !== userId) return reject("您不是群主");

      // 推送消息
      let online = await ctx.model.Online.findOne({userId: memberId});
      if (online && online.socketId && nsp.sockets[online.socketId]) {
        nsp.sockets[online.socketId].emit("group", {
          type: "leaveRoom",
          groupId: groupId
        });
      }

      for (let idx in members) {
        let item = members[idx];
        if (item.userId === memberId) {
          item.leaveTime = new Date().getTime();
          break;
        }
      }

      let modify = {members};
      let res = await ctx.model.Group.findOneAndUpdate({groupId}, modify, {new: true});
      resolve(this.handlerGroupInfo(res));
    });
  }

  // 添加群成员
  async append() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, request, app} = ctx;
      const {userId} = session;
      const {groupId} = request.body;
      const membersRequest = request.body.members;
      const nsp = app.io.of('/');

      const group = await ctx.model.Group.findOne({groupId});
      if (!group) return reject("群聊不存在");
      let {members} = group;

      // 校验是否已经存在
      for (let idx in membersRequest) {
        let memberId = membersRequest[idx].userId;
        let member = members.find(item => item.userId === memberId);
        if (member && !member.leaveTime) return reject("用户已经在群聊内了");
        if (member) members.splice(members.findIndex(item => item.userId === memberId), 1);

        let user = await ctx.model.User.findOne({userId: memberId});
        if (!user) return reject("用户不存在");

        // 加入新成员的会话列表
        await ctx.service.chat.updateChat({
          chatId: groupId,
          chatType: "2",
          username: user.username,
          userId: user.userId
        });

        members.push({
          username: user.username,
          userId: user.userId,
          joinTime: new Date().getTime(),
        });

        // 推送消息
        let online = await ctx.model.Online.findOne({userId: memberId});
        if (online && online.socketId && nsp.sockets[online.socketId]) {
          nsp.sockets[online.socketId].emit("group", {
            type: "joinRoom",
            groupId: groupId
          });
        }
      }

      let modify = {members};
      let res = await ctx.model.Group.findOneAndUpdate({groupId}, modify, {new: true});
      resolve(this.handlerGroupInfo(res));
    });
  }

  // 退出群聊
  async quit() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, request, app} = ctx;
      const {userId} = session;
      const {groupId} = request.body;
      const nsp = app.io.of('/');

      const group = await ctx.model.Group.findOne({groupId});
      if (!group) return reject("群聊不存在");
      let {members} = group;

      // 删除会话列表数据
      await ctx.model.Chat.deleteOne({userId, chatId: groupId});

      // 推送消息
      let online = await ctx.model.Online.findOne({userId});
      if (online && online.socketId && nsp.sockets[online.socketId]) {
        nsp.sockets[online.socketId].emit("group", {
          type: "leaveRoom",
          groupId: groupId
        });
      }

      for (let idx in members) {
        let item = members[idx];
        if (item.userId === userId) {
          item.leaveTime = new Date().getTime();
          break;
        }
      }

      let modify = {members};
      let res = await ctx.model.Group.findOneAndUpdate({groupId}, modify, {new: true});
      resolve(this.handlerGroupInfo(res));
    });
  }

  // 解散群聊
  async disband() {
    return new Promise(async (resolve, reject) => {
      const {ctx} = this;
      const {session, params} = ctx;
      const {userId} = session;
      const {groupId} = params;

      const group = await ctx.model.Group.findOne({groupId});
      if (!group) return reject("群聊不存在");
      let {master} = group;
      if (master !== userId) return reject("您不是群主");

      // 删除会话列表数据
      await ctx.model.Chat.deleteOne({userId, chatId: groupId});

      // 标记解散
      let modify = {disband: true};
      await ctx.model.Group.findOneAndUpdate({groupId}, modify, {new: true});

      resolve();
    });
  }
}

module.exports = GroupService;
