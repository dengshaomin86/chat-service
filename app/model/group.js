'use strict';

const { defaultAvatar } = require('@/config/constants');

// 聊天列表
module.exports = (app) => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const GroupSchema = new Schema({
    groupName: {
      type: String,
    },
    groupId: {
      type: String,
      required: true,
      unique: true,
    },
    // 群主
    master: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: () => defaultAvatar,
    },
    // 群公告
    announcement: {
      type: String,
      default: '',
    },
    // 群聊成员
    members: {
      type: Array,
      required: true,
      default: () => [],
    },
    // 是否已解散
    disband: {
      type: Boolean,
      default: false,
    },
    createDate: {
      type: String,
      default: () => new Date().getTime(),
    },
  });
  return mongoose.model('Group', GroupSchema);
};
