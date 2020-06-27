const room = "default_room";

// 这个中间件的作用是提示用户连接与断开的，连接成功的消息发送到客户端，断开连接的消息在服务端打印
module.exports = () => {
  return async (ctx, next) => {
    // 权限校验通过
    ctx.socket.emit('res', 'auth success');
    // 加入在线列表
    await ctx.service.online.add().then(res => {
      console.log("加入在线列表成功", res);
      ctx.socket.emit('res', '加入在线列表成功');
    }).catch(err => {
      console.log("加入在线列表失败", err);
      ctx.socket.emit('res', '加入在线列表失败');
    });
    // 加入房间
    ctx.socket.join(room);
    // 放行
    await next();
    // yield* next;
    console.log('断开连接');
  }
};