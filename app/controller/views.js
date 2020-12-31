'use strict';

const Controller = require('../core/baseController');

class ViewController extends Controller {
  async index() {
    const {ctx} = this;
    ctx.body = "egg view"
  }

  async test() {
    const {ctx} = this;
    await ctx.render('test.ejs', {name: 'view test'});
  }

  async test2() {
    const {ctx} = this;
    ctx.body = await ctx.renderString('<%= user %>', {user: 'popomore'}, {
      viewEngine: 'ejs',
    });
  }
}

module.exports = ViewController;
