// 这个中间件的作用是提示用户连接与断开的，连接成功的消息发送到客户端，断开连接的消息在服务端打印

module.exports = () => {
  return async (ctx, next) => {
    // 权限校验通过
    ctx.socket.emit('res', 'connected');
    // 加入在线列表
    let result = await ctx.service.online.add();
    if (result) {
      // console.log("加入在线列表成功", result);
      ctx.socket.emit('res', '加入在线列表成功');
      // 加入房间
      const {userId} = ctx.session;
      const user = await ctx.model.User.findOne({userId});
      const groups = user.group;
      for (let idx in groups) {
        const groupId = groups[idx];
        const group = await ctx.model.Group.findOne({groupId});
        const {members} = group;
        const member = members.find(item => item.userId === userId);
        if (!member.leaveTime) ctx.socket.join(groupId);
      }
    }
    // 放行
    await next();
    // console.log("加入在线列表失败", result);
    ctx.socket.emit('res', "加入在线列表失败");
  }
};
