'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const UserSchema = new Schema({
    username: {
      type: String,
      unique: true,
      required: true,
      minlength: 2,
      maxlength: 10,
    },
    usernameLowercase: {
      type: String,
      lowercase: true
    },
    userId: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 30,
    },
    avatar: {
      type: String,
      default: () => "/static/avatar/default.jpeg"
    },
    nickname: {
      type: String,
      default: () => ""
    },
    sex: {
      type: String,
      default: () => "0"
    },
    hobby: {
      type: String,
      default: () => ""
    },
    createDate: {
      type: String,
      default: () => new Date().getTime()
    }
  });
  return mongoose.model('User', UserSchema);
};
