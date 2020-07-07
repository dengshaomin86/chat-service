'use strict';

const Controller = require('../core/baseController');

class HomeController extends Controller {
  async index() {
    const {ctx} = this;
    ctx.body = 'hi, egg';
  }

  // 校验登录状态
  async checkOnline() {
    this.success({
      message: "在线"
    });
  }

  // 图片上传
  async uploadImg() {
    const {url, fields} = await this.uploadFile();
    this.success({
      message: "图片上传成功",
      url,
      fields
    });
  }
}

module.exports = HomeController;
