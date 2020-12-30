'use strict';
/**
 * RESTful API
 * GET 用来获取资源（ctx.query）
 * POST 用来新建资源（也可以用于更新资源）（ctx.request.body）
 * DELETE 用来删除资源（ctx.params）
 * PUT 方法主要是用来更新整个资源的
 * PATCH 方法主要是用来执行某项操作并更新资源的某些字段
 */

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const {router, controller, io} = app;
  const gzip = app.middleware.gzip({threshold: 1024});
  const userAuth = app.middleware.userauth({}, app);

  // home
  router.get('/', controller.home.index);
  router.get('/checkOnline', userAuth, controller.home.checkOnline);
  router.post('/uploadImg', userAuth, controller.home.uploadImg);

  // view
  router.get('/view', controller.view.index);
  router.get('/view/test', controller.view.test);
  router.get('/view/test2', controller.view.test2);

  // user
  router.get('/create/admin/:password', controller.user.createAdmin);
  router.post('/user/signIn', controller.user.signIn);
  router.post('/user/signUp', controller.user.signUp);
  router.get('/user/signOut', userAuth, controller.user.signOut);
  router.get('/user/info/:id', userAuth, controller.user.info);
  router.get('/user/search', userAuth, controller.user.search);
  router.post('/user/update', userAuth, controller.user.update);

  // friend
  router.get('/friend/list', userAuth, controller.friend.list);
  router.get('/friend/requestList', userAuth, controller.friend.requestList);
  router.post('/friend/add', userAuth, controller.friend.add);
  router.post('/friend/agree', userAuth, controller.friend.agree);
  router.post('/friend/refuse', userAuth, controller.friend.refuse);
  router.delete('/friend/remove/:id', userAuth, controller.friend.remove);

  // chat
  router.get('/chat/list', userAuth, controller.chat.list);
  router.get('/single/send', userAuth, controller.single.send);
  router.get('/single/record/:singleId', userAuth, controller.single.record);
  router.get('/group/record/:groupId', userAuth, controller.group.record);
  router.post('/group/create', userAuth, controller.group.create);
  router.get('/group/info/:groupId', userAuth, controller.group.info);
  router.patch('/group/update', userAuth, controller.group.update);
  router.patch('/group/remove', userAuth, controller.group.remove);
  router.patch('/group/append', userAuth, controller.group.append);
  router.patch('/group/quit', userAuth, controller.group.quit);
  router.delete('/group/disband/:groupId', userAuth, controller.group.disband);

  // message
  router.get('/message/list', userAuth, controller.message.list);

  // socket
  io.of('/').route('message', controller.message.message);
  io.of('/').route('messageSingle', controller.message.messageSingle);
  io.of('/').route('messageGroup', controller.message.messageGroup);
  io.of('/').route('joinRoom', controller.message.joinRoom);
  io.of('/').route('leaveRoom', controller.message.leaveRoom);
  io.of('/news').route('news', controller.news.index);
};
