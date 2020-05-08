const mongoose = require("mongoose");
const shortid = require("shortid");

const Schema = mongoose.Schema;

const exerSchema = new Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    requierd: true
  },
  date: {
    type: Date,
		default: new Date()
  },
},{versionKey:false});

exerSchema.pre("save", function(next) {
  if (this.date === null) {
    this.date = new Date();
  }
  next();
});

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  _id: {
    type: String,
    default: shortid.generate
  },
  log: [exerSchema]
},{versionKey:false});

module.exports = mongoose.model("User", userSchema);
