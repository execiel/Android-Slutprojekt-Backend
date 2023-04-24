const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const postSchema = new Schema({
  author: Schema.Types.ObjectId,
  title: String,
  content: String,
  createdAt: { type: Date, value: new Date() },
});

const postModel = mongoose.model("Post", postSchema);

module.exports = { postModel };
