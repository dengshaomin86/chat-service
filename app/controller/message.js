'use strict';
/**
 * socket.io
 * - nsp:Namespace 命名空间
 * - nsp.sockets[socketId].emit():给某个用户推送消息
 * - nsp.to(room).emit():给某个房间推送消息
 * - nsp.emit():给所有人推送消息
 * - socket.id:发送消息人的socketID
 * - socket.handshake:握手 https://www.wenjiangs.com/doc/6ealfln7
 * - socket.disconnect():断开连接
 * - ctx.args[0]:消息内容
 */

const Controller = require('../core/baseController');
const {getGroupName, createMsgId} = require("../core/baseConfig");

class MessageController extends Controller {
  // 聊天记录
  async list() {
    const {ctx} = this;
    await ctx.service.message.list().then(list => {
      this.success({
        list
      });
    }).catch(err => {
      this.error({
        message: "获取聊天记录失败",
        info: err
      });
    });
  }

  // 单聊
  async messageSingle() {
    const {ctx} = this;
    const {app, session, socket, logger, helper} = ctx;
    const {id} = socket;
    const {username, userId} = session;
    const nsp = app.io.of('/');
    const data = ctx.args[0];
    const {chatId, chatType, msg, createTime, msgType, withUsername, withUserId} = data;

    if (!msg) {
      nsp.sockets[id].emit('tips', {
        type: "warning",
        text: "消息不能为空"
      });
      return;
    }

    // 储存的消息体
    const storeObj = {
      singleId: chatId,
      createTime,
      msgType,
      msg,
      msgId: createMsgId(),
      fromUsername: username,
      fromUserId: userId,
    };

    // 储存消息记录
    let user = await ctx.model.User.findOne({userId: withUserId});
    if (!user) {
      nsp.sockets[id].emit('tips', {
        type: "warning",
        text: "用户不存在"
      });
      return;
    }
    await ctx.model.RecordSingle.create(storeObj);

    // 推送的消息体
    const fromUserAvatar = await ctx.service.user.avatar(userId);
    const pushObj = {
      ...data,
      ...storeObj,
      fromUserAvatar,
      fromUsername: username,
      fromUserId: userId,
      withUserAvatar: user.avatar,
    };

    // 根据 id 给指定连接发送消息（响应发送成功）
    nsp.sockets[id].emit('messageResponse', {
      ...pushObj,
      chatName: pushObj.withUsername,
      chatAvatar: pushObj.withUserAvatar,
    });

    // 检查对方是否在线
    const online = await ctx.model.Online.findOne({userId: withUserId});
    if (online && nsp.sockets[online.socketId]) {
      nsp.sockets[online.socketId].emit('messageResponse', {
        ...pushObj,
        chatName: username,
        chatAvatar: fromUserAvatar,
        withUsername: username,
        withUserId: userId,
        withUserAvatar: fromUserAvatar,
      });
    }

    // 更新会话列表
    await ctx.service.chat.updateChat({
      username: withUsername,
      userId: withUserId,
      chatType: "1",
      chatId
    });
  }

  // 群聊
  async messageGroup() {
    const {ctx} = this;
    const {app, session, socket, logger, helper} = ctx;
    const {id} = socket;
    const {username, userId} = session;
    const nsp = app.io.of('/');
    const data = ctx.args[0];
    const {chatId, chatType, msg, createTime, msgType} = data;

    // 获取房间里已连接用户的socketID
    // nsp.adapter.clients([roomName], (err, clients) => {
    //   console.log(JSON.stringify(clients));
    // });

    if (!msg) {
      return nsp.sockets[id].emit('tips', {
        type: "warning",
        text: "消息不能为空"
      });
    }

    // 储存的消息体
    const storeObj = {
      groupId: chatId,
      createTime,
      msgType,
      msg,
      msgId: createMsgId(),
      fromUsername: username,
      fromUserId: userId,
    };

    // 储存消息记录
    let group = await ctx.model.Group.findOne({groupId: chatId});
    const {groupName, avatar, groupId, members, disband} = group;
    if (!group) {
      return nsp.sockets[id].emit('tips', {
        type: "warning",
        text: "群聊不存在"
      });
    }

    if (disband) {
      return nsp.sockets[id].emit('tips', {
        type: "warning",
        text: "此群聊已解散"
      });
    }

    // 是否是群成员
    const member = members.find(item => item.userId === userId);
    if (!member || member.leaveTime) {
      return nsp.sockets[id].emit('tips', {
        type: "warning",
        text: "消息发送失败，您不是该群成员"
      });
    }

    await ctx.model.RecordGroup.create(storeObj);

    // 推送的消息体
    const fromUserAvatar = await ctx.service.user.avatar(userId);
    const pushObj = {
      ...storeObj,
      fromUserAvatar,
      chatType,
      chatId,
      chatName: getGroupName(groupName, members),
      chatAvatar: avatar,
    };

    // 给指定房间的每个人发送消息
    nsp.to(groupId).emit('messageResponse', pushObj);

    // 更新会话列表
    await ctx.service.chat.updateChat({
      username,
      userId,
      chatType: "2",
      chatId
    });
  }

  // 加入房间
  async joinRoom() {
    const {ctx} = this;
    const {socket} = ctx;
    const data = ctx.args[0];
    socket.join(data);
  }

  // 退出房间
  async leaveRoom() {
    const {ctx} = this;
    const {socket} = ctx;
    const data = ctx.args[0];
    socket.leave(data);
  }
}

module.exports = MessageController;
