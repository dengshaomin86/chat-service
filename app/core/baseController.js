'use strict';

const { Controller } = require('egg');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
// 故名思意 异步二进制 写入流
const awaitWriteStream = require('await-stream-ready').write;
// 管道读入一个虫洞
const sendToWormhole = require('stream-wormhole');

class BaseController extends Controller {
  get username() {
    return this.ctx.session.username;
  }

  success(data) {
    this.ctx.body = Object.assign(
      {
        flag: true,
        message: 'success',
      },
      data,
    );
  }

  error(data) {
    this.ctx.body = Object.assign(
      {
        flag: false,
        message: 'error',
      },
      data,
    );
  }

  notFound(msg) {
    msg = msg || 'not found';
    this.ctx.throw(404, msg);
  }

  // 上传文件的通用方法
  async upload() {
    const stream = await this.ctx.getFileStream();
    // 基础的目录
    const uploadBasePath = 'app/public/static/upload';
    // 分类目录
    const category = stream.fieldname;
    // 生成文件名
    const filename = `${moment().format('YYYYMMDDHHmmss')}_${parseInt(Math.random() * 1e6)}${path.extname(stream.filename).toLocaleLowerCase()}`;
    // 生成目录
    function mkdirsSync(dirname) {
      if (fs.existsSync(dirname)) {
        return true;
      } else {
        if (mkdirsSync(path.dirname(dirname))) {
          fs.mkdirSync(dirname);
          return true;
        }
      }
    }
    mkdirsSync(path.join(uploadBasePath, category));
    // 生成写入路径
    const target = path.join(uploadBasePath, category, filename);
    // 写入流
    const writeStream = fs.createWriteStream(target);
    try {
      // 异步把文件流 写入
      await awaitWriteStream(stream.pipe(writeStream));
    } catch (err) {
      // 如果出现错误，关闭管道
      await sendToWormhole(stream);
      return {
        error: '错误',
      };
    }
    return {
      url: path.join('/static/upload', category, filename).replace(/\\/g, '/'),
      fields: stream.fields,
    };
  }
}

module.exports = BaseController;
