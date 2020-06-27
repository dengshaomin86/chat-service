'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const MessageSchema = new Schema({
    chatId: {
      type: String,
      unique: true,
      required: true,
    },
    list: {
      type: Array,
      required: true
    }
  });
  return mongoose.model('Message', MessageSchema);
};
