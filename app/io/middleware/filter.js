// 这个中间件的作用是将接收到的数据再发送给客户端
// 作用于每一个数据包（每一条消息）；在生产环境中，通常用于对消息做预处理，又或者是对加密消息的解密等操作
module.exports = app => {
  return function* (next) {
    // this.socket.emit('res', 'packet received!');
    // console.log('packet:', this.packet);
    yield* next;
  };
};
