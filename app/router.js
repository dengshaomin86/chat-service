'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller,  io } = app;

  // home
  router.get('/', controller.home.index);
  router.get('/checkOnline', controller.home.checkOnline);

  // user
  router.get('/user', controller.user.index);
  router.get('/user/find/:username', controller.user.find);
  router.get('/user/findAll', controller.user.findAll);
  router.post('/user/signIn', controller.user.signIn);
  router.post('/user/signUp', controller.user.signUp);
  router.get('/user/signOut', controller.user.signOut);
  router.get('/user/getInfo', controller.user.getInfo);
  router.post('/user/update', controller.user.update);

  // chat
  router.get('/chat/addChatList', controller.chat.addChatList);
  router.get('/chat/getChatList', controller.chat.getChatList);
  router.get('/chat/getMsgList', controller.chat.getMsgList);
  router.get('/chat/getContactList', controller.chat.getContactList);
  router.get('/chat/addContactFriend', controller.chat.addContactFriend);
  router.get('/chat/getAddReqList', controller.chat.getAddReqList);
  router.get('/chat/agreeAddFriendReq', controller.chat.agreeAddFriendReq);
  router.get('/chat/refuseAddFriendReq', controller.chat.refuseAddFriendReq);
  router.get('/chat/searchUser', controller.chat.searchUser);

  // socket
  io.of('/').route('chat', controller.chat.index);
  io.of('/').route('message', controller.chat.message);
  io.of('/').route('user', controller.chat.online);

  io.of('/news').route('news', controller.news.index);
};
