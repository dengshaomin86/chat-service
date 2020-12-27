'use strict';

const Controller = require('../core/baseController');

class UserController extends Controller {
  // 创建管理员账户
  async createAdmin() {
    const {ctx} = this;
    await ctx.service.user.createAdmin().then(user => {
      this.success({
        message: "创建成功",
        user
      });
    }).catch(message => {
      this.error({
        message
      });
    });
  }

  // 注册
  async signUp() {
    const {ctx} = this;
    await ctx.service.user.signUp().then(user => {
      this.success({
        message: "注册成功",
        user
      });
    }).catch(message => {
      this.error({
        message
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
    await ctx.service.user.signOut().then(res => {
      this.success({
        message: "退出成功"
      });
    }).catch(err => {
      this.error({
        message: "操作失败",
        err,
      });
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

  // 搜索用户
  async search() {
    const {ctx} = this;
    await ctx.service.user.search().then(list => {
      this.success({
        list
      });
    }).catch(err => {
      this.error({
        info: err,
        message: err
      });
    });
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
}

module.exports = UserController;
