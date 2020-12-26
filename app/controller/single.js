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
const {roomNameDefault, avatarDefault} = require('../core/baseConfig');

class SingleController extends Controller {
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

  // 单人对话
  async message() {
    const {ctx} = this;
    const {app, socket, logger, helper} = ctx;
    const nsp = app.io.of('/');
    const id = socket.id;

    // 拼装完整消息体
    let msgObj = ctx.args[0];
    msgObj.fromUsername = ctx.session.username;
    msgObj.fromUserId = ctx.session.userId;
    await ctx.service.user.getAvatar(msgObj.fromUserId).then(url => {
      msgObj.fromUserAvatar = url;
    }).catch(err => {
      msgObj.fromUserAvatar = defaultAvatar;
    });

    await ctx.service.user.getAvatar(msgObj.toUserId).then(url => {
      msgObj.avatar = url;
    }).catch(err => {
      msgObj.avatar = defaultAvatar;
    });

    // 根据 id 给指定连接发送消息（响应发送成功）
    nsp.sockets[id].emit('messageResponse', msgObj);

    // 查找对方是否在线
    const onlineList = await ctx.model.Online.find({
      userId: msgObj.toUserId
    });
    if (onlineList.length && onlineList[0].socketId) {
      try {
        msgObj.avatar = msgObj.fromUserAvatar;
        nsp.sockets[onlineList[0].socketId].emit('message', msgObj);
      } catch (e) {
      }
    }

    // 储存聊天记录
    await ctx.service.message.add(msgObj).then(res => {
      console.log("储存成功");
    }).catch(err => {
      console.log("储存失败", err);
    });

    // 更新聊天列表
    await ctx.service.chatList.updateChatList(msgObj).then(res => {
      console.log("更新聊天列表成功");
    }).catch(err => {
      console.log("更新聊天列表失败", err);
    });
  }

  // 群组聊天
  async messageGroup() {
    const {ctx} = this;
    const {app, session, socket, logger, helper} = ctx;
    const {username, userId} = session;
    const nsp = app.io.of('/');
    const data = ctx.args[0];

    // 获取房间里已连接用户的socketID
    // nsp.adapter.clients([roomNameDefault], (err, clients) => {
    //   console.log(JSON.stringify(clients));
    // });

    // 拼装完整消息体
    const fromUserAvatar = await ctx.service.user.avatar(userId);
    const msgObj = {
      ...data,
      fromUsername: username,
      fromUserId: userId,
      fromUserAvatar,
      avatar: avatarDefault,
    };

    // 给指定房间的每个人发送消息
    nsp.to(roomNameDefault).emit('messageResponse', msgObj);

    // 储存聊天记录
    await ctx.service.messageGroup.add(msgObj);
  }

  /*-------------------------------------- test --------------------------------*/

  // 退出房间
  async testLeave() {
    const {ctx} = this;
    const {app, socket, logger, helper} = ctx;
    const nsp = app.io.of('/');

    // 踢出用户
    const tick = (id, msg) => {
      // 踢出用户前发送消息
      nsp.sockets[id].emit('res', msg);
      // 退出房间
      ctx.socket.leave(roomNameDefault);

      // 调用 adapter 方法踢出用户，客户端触发 disconnect 事件
      // nsp.adapter.remoteDisconnect(id, true, err => {
      //   logger.error(err);
      // });
    };

    const {username} = ctx.session;
    const user = await ctx.model.Online.findOne({
      username
    });

    if (user && user.socketId) {
      tick(user.socketId, "out");
    }

  }
}

module.exports = SingleController;
