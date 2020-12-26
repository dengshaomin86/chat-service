'use strict';

const Service = require('egg').Service;

function createChatId(fromUserId, toUserId) {
  return `${Math.min(fromUserId, toUserId)}&${Math.max(fromUserId, toUserId)}`;
}

class ChatService extends Service {
  // 新增聊天列表
  async add() {
    const {ctx} = this;
    const params = ctx.query;
    const {username} = params;

    // 获取用户信息
    const user = await ctx.model.User.findOne({username});
    if (!user) return null;
    const {userId, avatar} = user;

    let chatObj = null;
    if (params.type === "1") {
      // 单聊
      chatObj = {
        chatId: createChatId(ctx.session.userId, userId),
        chatType: "1",
        msg: "",
        msgDate: "",
        msgType: "1",
        toUsername: username,
        toUserId: userId,
        avatar,
        name: username
      };
    }
    return chatObj;
  }

  // 更新聊天列表
  async updateChatList(msgObj) {
    const {ctx} = this;

    // 发送方
    let userChatList = await ctx.model.Chat.find({
      userId: msgObj.fromUserId
    });
    if (userChatList.length) {
      let userChatObj = userChatList[0];
      let idx = userChatObj.list.findIndex(item => item === msgObj.chatId);
      if (idx !== -1) userChatObj.list.splice(idx, 1);
      userChatObj.list.unshift(msgObj.chatId);
      await ctx.model.Chat.updateOne({
        userId: msgObj.fromUserId
      }, userChatObj);
    } else {
      await ctx.model.Chat.create({
        username: msgObj.fromUsername,
        userId: msgObj.fromUserId,
        list: [msgObj.chatId]
      });
    }

    // 接收方
    userChatList = await ctx.model.Chat.find({
      userId: msgObj.toUserId
    });
    if (userChatList.length) {
      let userChatObj = userChatList[0];
      let idx = userChatObj.list.findIndex(item => item === msgObj.chatId);
      if (idx !== -1) userChatObj.list.splice(idx, 1);
      userChatObj.list.unshift(msgObj.chatId);
      await ctx.model.Chat.updateOne({
        userId: msgObj.toUserId
      }, userChatObj);
    } else {
      await ctx.model.Chat.create({
        username: msgObj.toUsername,
        userId: msgObj.toUserId,
        list: [msgObj.chatId]
      });
    }
  }

  // 获取聊天列表
  async list() {
    const {ctx} = this;

    const userChatList = await ctx.model.Chat.find({
      userId: ctx.session.userId
    });

    let list = [];
    if (userChatList.length && userChatList[0].list.length) {
      let chatList = userChatList[0].list;
      for (let item of chatList) {
        // 获取最后一条信息
        let msgList = await ctx.model.Message.find({
          chatId: item
        });
        let obj = JSON.parse(JSON.stringify(msgList[msgList.length - 1]));
        obj.name = obj.fromUserId === ctx.session.userId ? obj.toUsername : obj.fromUsername;
        let userId = obj.fromUserId === ctx.session.userId ? obj.toUserId : obj.fromUserId;
        await ctx.service.user.getAvatar(userId).then(url => {
          obj.avatar = url;
        }).catch(err => {
          obj.avatar = defaultAvatar;
        });
        list.push(obj);
      }
    }

    // 群聊数据
    let defaultGroup = {
      chatId: "group001",
      chatType: "2", // 群聊
      name: "默认群聊",
      msg: "goodnight",
      msgDate: new Date("2020/06/06 06:06:06").getTime(),
      fromUsername: "管理员",
      fromUserId: "001",
      avatar: defaultAvatar
    };
    // 获取最后一条信息
    let msgGroupList = await ctx.model.MessageGroup.find({
      chatId: "group001"
    });
    if (msgGroupList.length) {
      let msgGroupObj = JSON.parse(JSON.stringify(msgGroupList[msgGroupList.length - 1]));
      defaultGroup.msg = msgGroupObj.msg;
      defaultGroup.msgDate = msgGroupObj.msgDate;
      defaultGroup.fromUsername = msgGroupObj.fromUsername;
      defaultGroup.fromUserId = msgGroupObj.fromUserId;
    }
    list.push(defaultGroup);

    return list;
  }
}

module.exports = ChatService;
