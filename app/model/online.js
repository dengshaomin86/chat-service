'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const OnlineSchema = new Schema({
    username: {
      type: String,
      unique: true,
      required: true,
      minlength: 2,
      maxlength: 10
    },
    userId: {
      type: String,
      required: true,
    },
    socketId: {
      type: String,
      required: true
    }
  });
  return mongoose.model('Online', OnlineSchema);
};
