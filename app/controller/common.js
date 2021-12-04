'use strict';

const Controller = require('../core/baseController');

class HomeController extends Controller {
  // 校验登录状态
  async checkOnline() {
    this.success({
      message: '在线',
    });
  }

  // 图片上传
  async uploadImg() {
    const { url, fields } = await this.upload();
    this.success({
      message: '图片上传成功',
      url,
      fields,
    });
  }

  // 文件上传
  async uploadFile() {
    const { url, fields } = await this.upload();
    this.success({
      message: '文件上传成功',
      url,
      fields,
    });
  }
}

module.exports = HomeController;
