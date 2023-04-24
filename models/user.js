const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Follows user
  follows: [],
  // User follows
  following: [],
  createdAt: { type: Date, value: new Date() },
  description: String,
});

const userModel = mongoose.model("User", userSchema);

module.exports = { userModel };
