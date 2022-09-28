const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Dataset = new Schema({
    datasetId:{String, required: true, unique: true},
    userUpload:{type: String, required: true},
    savePath:{type: String},
    numTrain: { type:Number, required: true},
    numVal: { type:Number, required: true},
    numTest: { type:Number, required: true},
    dataType: { type: Array, required: true},
    desc: { type: String, required: true},
},{
    timestamps:{
        createdAt: "createdAt",
        updatedAt: "updatedAt",
    }
})
const dataSet =  mongoose.model('dataset',Dataset)
module.exports = dataSet