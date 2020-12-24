'use strict';

const Controller = require('../core/baseController');
const room = "default_room";

class MessageController extends Controller {

  // ****************************  socket  ****************************

  async test() {
    const {ctx} = this;
    const {socket, app} = ctx;
    const params = ctx.args[0];
    const nsp = app.io.of('/');
    console.log("params***", params);
    // console.log("nsp***", nsp);
    console.log("socket***1", socket.conn.id);
    // console.log("params.user***", params.user);
    // console.log("socket.id***", socket.id);
    // console.log("socket.handshake.query***", socket.handshake.query);
    // ctx.socket.emit('res', `to ${params.user} res`);
    ctx.socket.to("default_room").emit('res', params.user + '加入了房间');
  }

  async index() {
    const {app, socket, logger, helper} = this.ctx;
    const nsp = app.io.of('/');
    const id = socket.id;
    // 根据id给指定连接发送消息
    nsp.sockets[id].emit('res', `receive ${this.ctx.args[0].user} msg: ${this.ctx.args[0].msg}`);
    // 指定房间连接信息列表
    nsp.adapter.clients([room], (err, clients) => {
      console.log(JSON.stringify(clients));
    });
    // 给指定房间的每个人发送消息
    nsp.to(room).emit('res', this.ctx.socket.id + "上线了");
    // 发给所有人
    // nsp.emit('res', "emit msg");
    // 断开连接
    // this.ctx.socket.disconnect();
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
    const {app, socket, logger, helper} = ctx;
    const nsp = app.io.of('/');

    // 拼装完整消息体
    let msgObj = ctx.args[0];
    msgObj.fromUsername = ctx.session.username;
    msgObj.fromUserId = ctx.session.userId;
    await ctx.service.user.getAvatar(msgObj.fromUserId).then(url => {
      msgObj.fromUserAvatar = url;
    }).catch(err => {
      msgObj.fromUserAvatar = defaultAvatar;
    });
    msgObj.avatar = defaultAvatar;

    // 给指定房间的每个人发送消息
    nsp.to(room).emit('messageResponse', msgObj);

    // 储存聊天记录
    await ctx.service.messageGroup.add(msgObj).then(res => {
      console.log("储存成功");
    }).catch(err => {
      console.log("储存失败", err);
    });
  }

  // 退出
  async signOut() {
    const {ctx} = this;
    const {app, socket, logger, helper} = ctx;
    const nsp = app.io.of('/');

    // 踢出用户
    const tick = (id, msg) => {
      // 踢出用户前发送消息
      nsp.sockets[id].emit('res', msg);
      // 退出房间
      ctx.socket.leave(room);

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

module.exports = MessageController;
