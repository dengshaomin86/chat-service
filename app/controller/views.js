'use strict';

const Controller = require('../core/baseController');

class ViewController extends Controller {
  async index() {
    const {ctx} = this;
    await ctx.render('index.ejs', {title: 'CHAT-WELCOME'});
  }

  async renderString() {
    const {ctx} = this;
    ctx.body = await ctx.renderString('<%= user %>', {user: 'popomore'}, {
      viewEngine: 'ejs',
    });
  }
}

module.exports = ViewController;
