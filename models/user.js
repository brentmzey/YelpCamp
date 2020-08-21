const passportLocalMongoose = require("passport-local-mongoose"),
  mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: String,
  firstName: String,
  lastName: String,
  aboutMe: String,
  email: { type: String, unique: true, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: { type: Boolean, default: false },
  joinDate: { type: Date, default: Date.now },
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
