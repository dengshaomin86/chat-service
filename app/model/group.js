'use strict';

const {avatarDefault} = require('../core/baseConfig');

// 聊天列表
module.exports = app => {
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
      default: () => avatarDefault
    },
    // 群公告
    announcement: {
      type: String,
      default: ""
    },
    // 群聊成员
    members: {
      type: Array,
      required: true,
      default: () => []
    },
    createDate: {
      type: String,
      default: () => new Date().getTime()
    }
  });
  return mongoose.model('Group', GroupSchema);
};
