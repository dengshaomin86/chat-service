'use strict';

// 好友
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const FriendSchema = new Schema({
    userId: {
      type: String,
      required: true,
    },
    friendUserId: {
      type: String,
      required: true,
    },
    // 备注
    remark: {
      type: String,
      default: () => ""
    }
  });
  return mongoose.model('Friend', FriendSchema);
};
