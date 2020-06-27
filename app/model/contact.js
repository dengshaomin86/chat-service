'use strict';

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
    list: {
      type: Array,
      default: () => []
    }
  });
  return mongoose.model('Contact', ContactSchema);
};
