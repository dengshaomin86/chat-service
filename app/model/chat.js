'use strict';

// 聊天列表
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ChatSchema = new Schema({
    username: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 10,
    },
    userId: {
      type: String,
      required: true,
    },
    // 会话类型(1单聊,2群聊)
    chatType: {
      type: String,
      required: true,
    },
    // 会话ID(单聊、群聊的ID)
    chatId: {
      type: String,
      required: true,
    },
    // 创建时间
    createTime: {
      type: Date,
      default: () => new Date().getTime()
    },
    // 编辑时间
    editTime: {
      type: Date,
      required: true,
    }
  });
  return mongoose.model('Chat', ChatSchema);
};
