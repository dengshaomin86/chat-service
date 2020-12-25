'use strict';

const Controller = require('../core/baseController');

class UserController extends Controller {
  async index() {
    const {ctx} = this;
    ctx.body = 'user';
  }

  async delete() {
    const {ctx} = this;
    await ctx.model["user"].deleteOne({"_id": id});
  }

  // 更新用户信息
  async update() {
    const {ctx} = this;
    await ctx.service.user.update().then(data => {
      this.success({
        data,
        message: "修改成功"
      });
    }).catch(err => {
      this.error({
        message: "修改失败",
        info: err
      });
    });
  }

  async find() {
    const {ctx} = this;
    console.log('query***', ctx.query);
    console.log('params***', ctx.params);
    console.log('request***', ctx.request);
    let result = await ctx.model.User.find({
      userName: ctx.params.username || ""
    });
    console.log('result***', result);
    if (!result.length) {
      ctx.body = "无匹配用户";
      return;
    }
    if (result.length === 1) {
      ctx.body = result[0];
      return;
    }
    ctx.body = result;
  }

  // 查找所有用户信息
  async findAll() {
    const {ctx} = this;
    ctx.body = await ctx.model.User.find();
  }

  // 注册
  async signUp() {
    const {ctx} = this;
    const info = ctx.request.body;
    const users = await ctx.model.User.find({
      usernameLowercase: (info.username).toLowerCase()
    });
    if (users.length) {
      this.error({
        message: "用户已存在"
      });
      return;
    }
    if (info.password !== info.cfPassword) {
      this.error({
        message: "密码不一致，请重新输入"
      });
      return;
    }
    await ctx.service.user.add(info).then(res => {
      this.success({
        message: "注册成功"
      });
    }).catch(err => {
      this.error({
        message: err.message,
        info: err
      });
    });
  }

  // 登录
  async signIn() {
    const {ctx} = this;
    await ctx.service.user.signIn().then(user => {
      this.success({
        message: "登录成功",
        user
      });
    }).catch(err => {
      this.error({
        message: "用户名或密码错误"
      });
    });
  }

  // 退出登录
  async signOut() {
    const {ctx} = this;
    await ctx.service.online.remove().then(res => {
      console.log("退出在线列表成功", res);
      ctx.session.username = null;
      this.success({
        message: "退出成功"
      });
    }).catch(err => {
      console.log("退出在线列表失败", err);
    });
  }

  // 获取用户信息
  async info() {
    const {ctx} = this;
    await ctx.service.user.info().then(res => {
      this.success({
        data: res
      });
    }).catch(err => {
      this.error({
        info: err,
        message: "获取用户信息失败"
      });
    });
  }
}

module.exports = UserController;
