const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const labSchema = new Schema(
    {
        labId: { type: String, unique: true, required: true },
        labName: { type: String, required: true},
        userCreated: { type: String, required: true},
        trainLogPath: { type: String},
        testLogPath: { type: String },
        trainedModelPath: { type: String },
        configPath: { type: String},
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
);

const Lab = mongoose.model("lab", labSchema);
module.exports = Lab;