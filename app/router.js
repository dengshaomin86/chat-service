'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/user', controller.user.index);
  router.get('/user/add', controller.user.add);
  router.get('/user/find/:username', controller.user.find);
  router.get('/user/findAll', controller.user.findAll);
  router.post('/user/signIn', controller.user.signIn);
  router.post('/user/signUp', controller.user.signUp);
};
