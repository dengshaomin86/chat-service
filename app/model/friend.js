'use strict';

// 好友
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const FriendSchema = new Schema({
    username: {
      type: String,
      unique: true,
      required: true,
      minlength: 2,
      maxlength: 10,
    },
    userId: {
      type: String,
      required: true,
    },
    // 好友列表
    list: {
      type: Array,
      default: () => []
    },
    // 好友请求状态列表
    request: {
      type: Array,
      default: () => []
    }
  });
  return mongoose.model('Friend', FriendSchema);
};
