const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const logSchema = new Schema(
  {
    logId: { type: String, unique: true, required: true },
    url: {type: String, required: true},
    timeExecute: {type: Date, required: true},
    result: { type: String, required: true },
    userId: { type: String, required: true }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

const Log = mongoose.model("log", logSchema);
module.exports = Log;
