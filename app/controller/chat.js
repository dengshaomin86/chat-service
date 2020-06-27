'use strict';

const Controller = require('../core/baseController');
const room = "default_room";

class ChatController extends Controller {

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

    // 根据 id 给指定连接发送消息（响应发送成功）
    nsp.sockets[id].emit('messageResponse', msgObj);

    // 查找对方是否在线
    const onlineList = await ctx.model.Online.find({
      userId: msgObj.toUserId
    });
    if (onlineList.length && onlineList[0].socketId) {
      try {
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

    // 给指定房间的每个人发送消息
    nsp.to(room).emit('messageResponse', msgObj);

    // 储存聊天记录
    await ctx.service.messageGroup.add(msgObj).then(res => {
      console.log("储存成功");
    }).catch(err => {
      console.log("储存失败", err);
    });
  }


  // ****************************  http  ****************************

  // 新增聊天列表
  async addChatList() {
    const {ctx} = this;
    await ctx.service.chatList.add().then(res => {
      this.success({
        message: "创建成功",
        data: res
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
    await ctx.service.chatList.getChatList().then(list => {
      this.success({
        list
      });
    }).catch(err => {
      this.error({
        message: "获取列表失败",
        info: err
      });
    });
  }

  // 对话列表
  async getMsgList() {
    const {ctx} = this;
    await ctx.service.message.getMsgList().then(list => {
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

  // 联系人列表
  async getContactList() {
    const {ctx} = this;
    let list = [];

    // 查找联系人列表
    const contact = await ctx.model.Contact.find({
      username: ctx.session.username
    });
    if (contact.length) list = contact[0].list;

    // 好友请求数量
    const reqList = await ctx.model.ContactRequest.find({
      username: ctx.session.username
    });
    let addReqNum = 0;
    if (reqList.length) addReqNum = reqList[0].list.filter(item => item.status === "0").length;

    this.success({
      addReqNum,
      list
    });
  }

  // 添加联系人
  async addContactFriend() {
    const {ctx} = this;
    await ctx.service.contactRequest.add().then(res => {
      this.success({
        message: "成功发送好友请求，等待对方同意",
        status: "2",
        statusText: "待回应",
      });
    }).catch(err => {
      this.error({
        message: "添加失败",
        info: err
      });
    });
  }

  // 好友请求列表
  async getAddReqList() {
    const {ctx} = this;

    const reqList = await ctx.model.ContactRequest.find({
      username: ctx.session.username
    });

    let list = [];
    if (reqList.length) list = reqList[0].list;
    this.success({
      list
    });
  }

  // 同意好友请求
  async agreeAddFriendReq() {
    const {ctx} = this;
    await ctx.service.contactRequest.agree().then(res => {
      this.success({
        message: "你们现在可以聊天了",
        status: "1",
        statusText: "已同意",
      });
    }).catch(err => {
      this.error({
        message: "操作失败，请换个姿势再试",
        info: err
      });
    });
  }

  // 拒绝好友请求
  async refuseAddFriendReq() {
    const {ctx} = this;
    await ctx.service.contactRequest.refuse().then(res => {
      this.success({
        message: "你成功拒绝了一次骚扰",
        status: "2",
        statusText: "已拒绝",
      });
    }).catch(err => {
      this.error({
        message: "操作失败，请换个姿势再试",
        info: err
      });
    });
  }

  // 搜索用户
  async searchUser() {
    const {ctx} = this;
    const params = ctx.query;
    let userList = await ctx.model.User.find({
      usernameLowercase: params.keyword.toLowerCase()
    });

    let list = [];
    for (let item of userList) {
      let status = "0"; // 0 未添加；1 已添加；2 待回应
      let statusText = "未添加"; // 0 未添加；1 已添加；2 待回应

      // 查找是否已经是好友
      let contact = await ctx.model.Contact.find({
        username: item.username
      });
      if (contact.length && contact[0].list.find(fri => fri.username === ctx.session.username)) {
        status = "1";
        statusText = "已添加";
      }

      // 查找是否待回应
      let contactRequest = await ctx.model.ContactRequest.find({
        username: item.username
      });
      if (contactRequest.length && contactRequest[0].list.find(fri => fri.username === ctx.session.username && fri.status === "0")) {
        status = "2";
        statusText = "待回应";
      }

      list.push({
        username: item.username,
        userId: item.userId,
        status,
        statusText
      });
    }

    this.success({
      list
    });
  }
}

module.exports = ChatController;
