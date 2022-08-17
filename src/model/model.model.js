const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const modelSchema = new Schema(
    {
        modelId: { type: String, unique: true, required: true },
        urlSaveModel: { type: String, required: true, unique: true },
        params: { type: Schema.Types.Mixed, required: false },
        desc: { type: String, required: false }
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
);

const Model = mongoose.model("model", modelSchema);
module.exports = Model;
