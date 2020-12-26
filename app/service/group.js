'use strict';

const Service = require('egg').Service;

const {groupPublic} = require("../core/baseConfig");

class GroupService extends Service {
  // 创建群组ID
  static createGroupId(userId) {
    return `g${new Date().getTime()}${userId}`;
  }

  // 创建公共群聊
  async createPublic({username, userId}) {
    const {ctx} = this;
    return await ctx.model.Group.create({
      ...groupPublic,
      master: userId,
      members: [{username, userId}],
      record: [
        {
          msgType: "1",
          msg: groupPublic.msg,
          fromUsername: username,
          fromUserId: userId,
          createTime: new Date().getTime(),
        }
      ],
    });
  }

  // 创建群聊
  async create() {
    const {ctx} = this;
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
      if (!group) resolve([]);
      const {record, groupName, avatar} = group;
      // 处理消息内容
      let list = [];
      for (let idx  in record) {
        let item = record[idx];
        let {fromUserId} = item;
        let fromUserAvatar = await ctx.service.user.avatar(fromUserId);
        list.push({
          ...item,
          fromUserAvatar,
          chatType: "2",
          chatId: groupId,
          name: groupName,
          avatar,
          groupId,
          groupName,
        });
      }
      resolve(list);
    });
  }
}

module.exports = GroupService;
