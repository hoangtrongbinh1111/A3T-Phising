const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {random} = require("../../helpers/rand");

const labSchema = new Schema(
    {
        labId: { type: String, unique: true, required: true },
        labName: { type: String, required: true},
        userCreated: { type: String, default: null},
        trainLogPath: { type: String, default: null },
        testLogPath: { type: String, default: null },
        trainedModelPath: { type: String, default: null },
        config:  {
            pre_train_data_path: { type: String, default:'./data/data.csv'},
            pre_train_model_type:{type: String, default:"sequential"},
            // pre_train_feature_set:{type: String, default:"full_set"},
            pre_train_test_size:{type: Number,default:0.3},
            // pre_train_random_state:{type: Number, default: random(1,100)}, 
            pre_train_number_records:{type:Number,default:100},

            // pre_inf_data_path : {type:String,default:null},
            pre_inf_feature_set:{type:String,default:'full_set'},

            x_train : {type:String, default : null},
            y_train : {type:String, default : null},
            train_num_epoch : {type: Number, default:10},
            train_batch_size : {type:Number, default:32},
            train_model_type :{type : Number,default:null},
            train_model_config : {type : Number, default: null},
            
            
            x_test:{type: Array,default:null},
            y_test:{type: Array,default: null},
            test_output_folder:{type: String,default:null},
            test_epoch_num: {type:String,default: null},

            inf_output_foler:{type: String,default:null},
            inf_data_path:{type:Array,default:null},
            inf_epoch_num: {type:String,default:null},

        },
        modelId: {type:String,default: null},
        datasetId: {type: String, default: null},
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