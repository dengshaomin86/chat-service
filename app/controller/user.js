'use strict';

// const Controller = require('egg').Controller;
const Controller = require('../core/baseController');

class UserController extends Controller {
  async index() {
    const {ctx} = this;
    ctx.body = 'user';
  }

  async add() {
    const {ctx} = this;
    ctx.body = ctx.service.user.add();
  }

  async delete() {
    await this.ctx.model[model].deleteOne({"_id": id});
  }

  async update() {
    await this.ctx.model.Admin.updateOne({"_id": id}, {
      mobile, email, role_id
    })
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

  async findAll() {
    const {ctx} = this;
    let result = await ctx.model.User.find();
    console.log('result***', result);
    ctx.body = result;
  }

  // 注册
  async signUp() {
    const {ctx} = this;
    const info = ctx.request.body;
    const users = await ctx.model.User.find({
      username: info.username
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
    await ctx.service.user.add({
      username: info.username,
      password: info.password
    }).then(res => {
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
    const info = ctx.request.body;
    await new Promise((resolve, reject) => {
      ctx.model.User.find({
        username: info.username
      }).then(res => {
        if (info.password !== res[0].password) {
          reject();
          return;
        }
        resolve();
      }).catch(err => {
        reject();
      });
    }).then(res => {
      this.success({
        message: "登录成功"
      });
    }).catch(err => {
      this.error({
        message: "用户名或密码错误"
      });
    });
  }
}

module.exports = UserController;
