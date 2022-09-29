const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Dataset = new Schema({
    datasetId: { String, required: true, unique: true },
    userUpload: { type: String, required: true },
    savePath: { type: String, default: null },
    numTrain: { type: Number, default: null },
    numVal: { type: Number, default: null },
    numTest: { type: Number, default: null },
    dataType: { type: Array, default: null },
    desc: { type: String, default: null },
}, {
    timestamps: {
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    }
})
const dataSet = mongoose.model('dataset', Dataset)
module.exports = dataSet