'use strict';

// const Controller = require('egg').Controller;
const Controller = require('../core/baseController');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }

  // 校验登录状态
  async checkOnline() {
    const { ctx } = this;
    if (!ctx.session.username) {
      this.error({
        message: "您已掉线，请重新登录"
      });
      return;
    }
    this.success({
      message: "在线"
    });
  }
}

module.exports = HomeController;
