'use strict';

const {Service} = require('egg');
const {pick} = require('lodash');

const {groupPublic, storeMsgKey, getGroupName} = require("../core/baseConfig");

class GroupService extends Service {
  // 创建群组ID
  static createGroupId(userId) {
    return `g${new Date().getTime()}${userId}`;
  }

  // 创建公共群聊
  async createPublic({username, userId}) {
    const {ctx} = this;

    // 创建群组
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
        reject("群组不存在");
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
      const {groupId} = params;
      const group = await ctx.model.Group.findOne({groupId});
      if (!group) {
        resolve([]);
        return;
      }
      const {groupName, avatar, members} = group;
      const record = await ctx.model.RecordGroup.find({groupId});
      if (!record || !record.length) {
        resolve([]);
        return;
      }
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
          groupId,
          groupName,
        });
      }
      resolve(list);
    });
  }
}

module.exports = GroupService;
