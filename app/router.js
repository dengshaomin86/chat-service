'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller,  io } = app;
  const gzip = app.middleware.gzip({ threshold: 1024 });
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
  router.post('/user/signIn', controller.user.signIn);
  router.post('/user/signUp', controller.user.signUp);
  router.get('/user/signOut', userAuth, controller.user.signOut);
  router.post('/user/getInfo', userAuth, controller.user.getInfo);
  router.post('/user/update', userAuth, controller.user.update);

  // chat
  router.get('/chat/addChatList', userAuth, controller.chat.addChatList);
  router.get('/chat/getChatList', userAuth, controller.chat.getChatList);
  router.get('/chat/getMsgList', userAuth, controller.chat.getMsgList);
  router.get('/chat/getContactList', userAuth, controller.chat.getContactList);
  router.get('/chat/addContactFriend', userAuth, controller.chat.addContactFriend);
  router.get('/chat/getAddReqList', userAuth, controller.chat.getAddReqList);
  router.get('/chat/agreeAddFriendReq', userAuth, controller.chat.agreeAddFriendReq);
  router.get('/chat/refuseAddFriendReq', userAuth, controller.chat.refuseAddFriendReq);
  router.get('/chat/searchUser', userAuth, controller.chat.searchUser);

  // socket
  io.of('/').route('chat', controller.chat.index);
  io.of('/').route('message', controller.chat.message);
  io.of('/').route('messageGroup', controller.chat.messageGroup);
  io.of('/').route('user', controller.chat.online);

  io.of('/news').route('news', controller.news.index);
};
