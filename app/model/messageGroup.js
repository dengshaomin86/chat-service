'use strict';

// 单聊记录
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const MessageGroupSchema = new Schema({
    chatId: {
      type: String,
      required: true,
    },
    // 聊天类型：1 单聊；2 群聊
    chatType: {
      type: String,
      default: () => "2"
    },
    msg: {
      type: String,
      required: true,
    },
    msgDate: {
      type: Date,
      required: true,
    },
    // 消息类型：1 普通文本信息
    msgType: {
      type: String,
      required: true,
      default: () => "1"
    },
    fromUsername: {
      type: String,
      required: true,
    },
    fromUserId: {
      type: String,
      required: true,
    }
  });
  return mongoose.model('MessageGroup', MessageGroupSchema);
};
