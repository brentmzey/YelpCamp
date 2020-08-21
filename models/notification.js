const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  username: String,
  campgroundId: String,
  commentId: String,
  isCampgroundNotification: { type: Boolean, default: false },
  isCommentNotification: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
});

module.exports = mongoose.model("Notification", notificationSchema);
