'use strict';

// 好友请求
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const FriendRequestSchema = new Schema({
    userId: {
      type: String,
      required: true,
    },
    friendUserId: {
      type: String,
      required: true,
    },
    // 状态值
    friendStatus: {
      type: String,
      required: true,
    },
    // 留言
    msg: {
      type: String,
      required: true,
    },
  });
  return mongoose.model('FriendRequest', FriendRequestSchema);
};
