const {Controller} = require('egg');

class BaseController extends Controller {
  get user() {
    return this.ctx.session.user;
  }

  success(data) {
    const {ctx} = this;
    ctx.body = Object.assign({
      flag: true,
      message: "success"
    }, data);
  }

  error(data) {
    const {ctx} = this;
    ctx.body = Object.assign({
      flag: false,
      message: "error"
    }, data);
  }

  notFound(msg) {
    msg = msg || 'not found';
    this.ctx.throw(404, msg);
  }
}

module.exports = BaseController;
