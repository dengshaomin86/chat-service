'use strict';

// 联系人
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ContactSchema = new Schema({
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
    list: {
      type: Array,
      default: () => []
    }
  });
  return mongoose.model('Contact', ContactSchema);
};
