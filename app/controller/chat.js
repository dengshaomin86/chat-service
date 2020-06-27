'use strict';

const Controller = require('../core/baseController');
const room = "default_room";

class ChatController extends Controller {
  async index1() {
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
    // 根据 id 给指定连接发送消息（响应发送成功）
    nsp.sockets[id].emit('messageResponse', ctx.args[0]);
    // 查找对方是否在线
    const onlineList = await ctx.model.Online.find({
      username: ctx.args[0].toUser
    });
    if (onlineList.length) {
      nsp.sockets[onlineList[0].socketId].emit('message', ctx.args[0]);
    }
    // 储存聊天记录
    await ctx.service.message.add().then(res => {
      console.log("储存成功");
    }).catch(err => {
      console.log("储存失败");
    });
  }

  // 新增聊天列表
  async addChatList() {
    const {ctx} = this;
    await ctx.service.chatList.add().then(res => {
      this.success({
        message: "创建成功"
      });
    }).catch(err => {
      this.error({
        message: "创建失败",
        info: err
      });
    });
  }

  // 聊天列表
  async getChatList() {
    const {ctx} = this;
    const userChatList = await ctx.model.ChatList.find({
      username: ctx.session.username
    });
    let list = [];
    if (userChatList.length) {
      list = userChatList[0].chatList;
    }
    const defaultGroup = {
      type: "2", // 群聊
      chatId: "group001",
      name: "群聊",
      lastMsg: "hello everyone",
      lastMsgDate: new Date("2020/06/26 13:13:13").getTime(),
      lastMsgUser: "dd1"
    };
    list.push(defaultGroup);
    this.success({
      list
    });
  }

  // 对话列表
  async getMsgList() {
    const {ctx} = this;
    const params = ctx.query;
    let list = [];

    // 查找是否有对应的聊天列表
    const messageList = await ctx.model.Message.find({
      chatId: params.chatId
    });

    if (messageList.length) {
      list = messageList[0].list;
    }

    if (params.chatId === "group001") {
      list = [
        {
          type: "2",
          chatId: "002",
          msg: "hello everyone",
          msgDate: "2020/06/27 12:12:12",
          msgUser: "dd1",
          msgType: "1"
        },
        {
          type: "2",
          chatId: "002",
          msg: "hello everyone2",
          msgDate: "2020/06/27 12:12:12",
          msgUser: "dd1",
          msgType: "1"
        },
        {
          type: "2",
          chatId: "002",
          msg: "hello everyone3",
          msgDate: "2020/06/27 12:12:12",
          msgUser: "dd3",
          msgType: "1"
        }
      ];
    }

    this.success({
      list: list
    });
  }

  // 联系人列表
  async getContactList() {
    const {ctx} = this;
    const list = await ctx.model.User.find();
    this.success({
      list
    });
  }
}

module.exports = ChatController;
