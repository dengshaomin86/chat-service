'use strict';

// const Controller = require('egg').Controller;
const Controller = require('../core/baseController');
const pick = require("lodash").pick;

class UserController extends Controller {
  async index() {
    const {ctx} = this;
    ctx.body = 'user';
  }

  async delete() {
    await this.ctx.model[model].deleteOne({"_id": id});
  }

  async update() {
    const {ctx} = this;
    const info = ctx.request.body;
    if (ctx.session.username !== info.username) {
      this.error({
        message: "无权限修改"
      });
      return;
    }
    await ctx.model.User.updateOne({
      username: info.username
    }, {
      nickname: info.nickname,
      sex: info.sex,
      hobby: info.hobby
    }).then(res => {
      this.success({
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

  async findAll() {
    const {ctx} = this;
    ctx.body = await ctx.model.User.find();
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
      ctx.session.username = info.username;
      this.success({
        message: "登录成功"
      });
    }).catch(err => {
      this.error({
        message: "用户名或密码错误"
      });
    });
  }

  async getInfo() {
    const {ctx} = this;
    if (!ctx.session.username) {
      this.error({
        message: "您已掉线，请重新登录"
      });
      return;
    }
    await ctx.model.User.find({
      username: ctx.session.username
    }).then(res => {
      if (!res.length) {
        this.error({
          message: "获取用户信息失败"
        });
        return;
      }
      const data = pick(res[0], ["username", "nickname", "sex", "hobby", "createDate"]);
      this.success({
        data
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
