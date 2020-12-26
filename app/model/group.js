'use strict';

const {avatarDefault} = require('../core/baseConfig');

// 聊天列表
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const GroupSchema = new Schema({
    groupName: {
      type: String,
      unique: true,
      required: true,
      minlength: 2,
      maxlength: 10,
    },
    groupId: {
      type: String,
      required: true,
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
    // 群组成员
    members: {
      type: Array,
      default: () => []
    },
    // 聊天记录
    record: {
      type: Array,
      default: () => []
    },
    createDate: {
      type: String,
      default: () => new Date().getTime()
    }
  });
  return mongoose.model('Group', GroupSchema);
};
