const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const logSchema = new Schema(
  {
    logId: { type: String, unique: true, required: true },
    trainHistory: [
      {train_acc: String, val_acc: String}
    ],
    testHistory: [
      {test_acc: String, model_checkpoint_number: String}
    ],
    inferenceHistory: {label: String,score: String,url: String, model_checkpoint_number: String}
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
