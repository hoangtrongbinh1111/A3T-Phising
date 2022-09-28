const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const labSchema = new Schema(
    {
        labId: { type: String, unique: true, required: true },
        labName: { type: String, required: true},
        userCreated: { type: String, required: true},
        trainLogPath: { type: String, required: true, unique: true },
        testLogPath: { type: String, required: true, unique: true },
        trainedModelPath: { type: String, required: true, unique: true },
        configPath: { type: String, required: true, unique: true},
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