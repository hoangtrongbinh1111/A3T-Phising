const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const labSchema = new Schema(
    {
        labId: { type: String, unique: true, required: true },
        labName: { type: String, required: true},
        userCreated: { type: String, default: null},
        trainLogPath: { type: String, default: null },
        testLogPath: { type: String, default: null },
        trainedModelPath: { type: String, default: null },
        configPath: { type: String, default: null},
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