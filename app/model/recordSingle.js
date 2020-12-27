'use strict';

// 单聊记录
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const RecordSingleSchema = new Schema({
    singleId: {
      type: String,
      required: true,
    },
    // 发送人用户名
    fromUsername: {
      type: String,
      required: true,
    },
    // 发送人ID
    fromUserId: {
      type: String,
      required: true,
    },
    // 消息类型('1'文本)
    msgType: {
      type: String,
      required: true,
      default: () => "1"
    },
    // 消息内容
    msg: {
      type: String,
      required: true,
    },
    // 发送时间
    createTime: {
      type: Date,
      required: true,
    }
  });
  return mongoose.model('RecordSingle', RecordSingleSchema);
};
