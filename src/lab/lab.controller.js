const Joi = require("joi");
const { spawn, exec, spawnSync } = require("child_process");
const { PythonShell } = require("python-shell");
require("dotenv").config();
const { v4: uuid } = require("uuid");
const Lab = require("./lab.model");
const {
  responseServerError,
  responseInValid,
  responseSuccess,
  responseSuccessWithData,
} = require("../../helpers/ResponseRequest");
const path = require("path");
const {
  LAB_FOLDER,
  LAB_SUBFOLDER,
  CONFIG_FOLDER,
  FILE_CFG,
} = require("../../helpers/constant");
const { getDir, removeDir, createFile } = require("../../helpers/file");
const { type } = require("os");
const { config } = require("dotenv");

const labCreateSchema = Joi.object().keys({
  labName: Joi.string().required(),
  userCreated: Joi.string().required(),
});

const labEditModelAndDataset = Joi.object().keys({
  labId: Joi.string().required(),
  modelId: Joi.string().required(),
  datasetId: Joi.string().required(),
});

const labUpdateSchema = Joi.object().keys({
  labId: Joi.string().required(),
  labName: Joi.string().optional(),
});

const configUpdateSchema = Joi.object().keys({
  labId: Joi.string().required(),
  config: {
    pre_train_data_path: Joi.string().required(),
    pre_train_model_type: Joi.string().required(),
    pre_train_feature_set: Joi.string().required(),
    pre_train_test_size: Joi.number().required(),
    pre_train_random_state: Joi.number().required(),
    pre_train_number_records: Joi.number().required(),

    pre_inf_data_path: Joi.string().required(),
    pre_inf_feature_set: Joi.string().required(),

    x_train: Joi.string().required(),
    y_train: Joi.string().required(),
    train_num_epoch: Joi.string().required(),
    train_batch_size: Joi.number().required(),
    train_model_type: Joi.number().required(),
    train_model_config: Joi.number().required(),

    x_test: Joi.array().required(),
    y_test: Joi.array().required(),
    test_output_folder: Joi.string().required(),
    test_epoch_num: Joi.string().required(),

    inf_output_foler: Joi.string().required(),
    inf_data_path: Joi.array().required(),
    inf_epoch_num: Joi.string().required(),
  },
});
exports.listLab = async (req, res) => {
  try {
    let { search, page, limit, from_time, to_time } = req.query;
    let options = {};
    if (search && search !== "") {
      options = {
        ...options,
        $or: [
          { url: new RegExp(search.toString(), "i") },
          { type: new RegExp(search.toString(), "i") },
        ],
      };
    }
    if (from_time && to_time) {
      options = {
        ...options,
        create_At: {
          $gte: new Date(from_time).toISOString(),
          $lt: new Date(to_time).toISOString(),
        },
      };
    }

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const data = await Lab.find(options)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
    const total = await Lab.find(options).countDocuments();
    return responseSuccessWithData({
      res,
      data: {
        data,
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return responseServerError({ res, err: error.message });
  }
};

exports.createLab = async (req, res) => {
  try {
    const result = labCreateSchema.validate(req.body);
    if (result.error) {
      return responseServerError({ res, err: result.error.message });
    }
    const { labName, userCreated } = req.body;
    const labId = uuid();
    // create folder
    const root = path.resolve("./");
    const labDir = getDir({ dir: root + `/${LAB_FOLDER}/${labId}` });

    const subLabDir = {};
    Object.keys(LAB_SUBFOLDER).map((subfolder) => {
      const dirPath = `/${LAB_FOLDER}/${labId}/${LAB_SUBFOLDER[subfolder]}`;
      getDir({ dir: root + dirPath });
      subLabDir[subfolder] = dirPath;
    });
    // done create

    // Thêm vào lab entity
    const labData = {
      labId,
      labName,
      userCreated,
      trainLogPath: subLabDir["trainLogPath"],
      testLogPath: subLabDir["testLogPath"],
      trainedModelPath: subLabDir["trainedModelPath"],
      // config : ,
    };
    const newLab = new Lab(labData);
    await newLab.save();

    return responseSuccessWithData({ res, data: newLab });
  } catch (error) {
    return responseServerError({ res, err: error.message });
  }
};

exports.updateLab = async (req, res) => {
  try {
    const result = labUpdateSchema.validate(req.body);
    if (result.error) {
      return responseServerError({ res, err: result.error.message });
    }
    const { labId, labName } = req.body;
    var labItem = await Lab.findOne({ labId: labId });
    if (!labItem) {
      return responseServerError({ res, err: "Lab not found" });
    }
  } catch (error) {
    return responseServerError({ res, err: error.message });
  };
}

exports.readLab = async (req, res) => {
  try {
    const { labId } = req.query;
    let labItem = await Lab.findOne({ labId: labId });
    if (labItem) {
      return responseSuccessWithData({ res, data: labItem });
    } else {
      return responseServerError({ res, err: "Lab not found" });
    }
  } catch (error) {
    return responseServerError({ res, err: error.message });
  }
};

exports.deleteLab = async (req, res) => {
  try {
    const { labId } = req.query;

    var labItem = await Lab.findOne({
      labId: labId,
    });
    if (!labItem) {
      return responseServerError({ res, err: "Lab không tồn tại!" });
    }
    await Lab.deleteOne({ labId: labId });
    // delete folder
    const root = path.resolve("./");
    const labDir = removeDir({
      dir: root + `/${LAB_FOLDER}/${labId}`,
    });
    // done delete
    return responseSuccess({ res });
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
};

exports.editModelAndDatasetLab = async (req, res) => {
  try {
    const result = labEditModelAndDataset.validate(req.body);
    if (result.error) {
      return responseServerError({ res, err: result.error.message });
    }
    const { labId, modelId, datasetId } = req.body;
    var labItem = await Lab.findOne({ labId: labId });
    if (!labItem) {
      return responseServerError({ res, err: "Lab not found" });
    }
    delete result.value.labId;
    let labUpdate = await Lab.findOneAndUpdate({ labId: labId }, result.value, {
      new: true,
    });
    return responseSuccessWithData({
      res,
      data: labUpdate,
    });
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const { labId } = req.query;
    var labItem = await Lab.findOne({ labId: labId }, "config");
    if (labItem) {
      return responseSuccessWithData({ res, data: labItem });
    } else {
      return responseServerError({ res, err: "Lab not found" });
    }
  } catch (error) {
    return responseServerError({ res, err: error.message });
  }
};

exports.editConfig = async (req, res) => {
  try {
    const result = configUpdateSchema.validate(req.body);
    if (result.error) {
      return responseServerError({ res, err: result.error.message });
    }
    const { labId, config } = req.body;

    var labItem = await Lab.findOne({ labId: labId });
    if (!labItem) {
      return responseServerError({ res, err: "Lab not found" });
    }
    delete result.value.labId;
    let labUpdate = await Lab.findOneAndUpdate(
      { labId: labId },
      { $set: { config: config } },
      {
        new: true,
      }
    );
    return responseSuccessWithData({
      res,
      data: labUpdate,
    });
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
};

exports.trainModule = async (req, res) => {
  try {
    var { labId } = req.body;
    var labConfig = await Lab.findOne({ labId: labId }, "config");
    if (!labConfig) {
      return responseServerError({ res, err: "Lab not found" });
    }
    //tạo 1 mảng lưu các key value của Train Config
    var keysTrainConfig = [];
    //thêm các key value vào mảng
    Object.entries(labConfig.config).forEach((cf) => {
      if (cf[0].includes("train") && !cf[0].includes("pre"))
        keysTrainConfig.push(cf);
    });
    var command = "python3 demo.py";
    //nối các key value vào command
    var result = keysTrainConfig.reduce((acc, key) => {
      return acc + ` --${key[0]} ${key[1].toString()}`;
    }, command);

    try {
      exec('activate phising', function (error, stdout, stderr) {  //active anaconda env
      })
      exec(result, (error, stdout, stderr) => {
        console.log(error.toString());
      })
      return responseSuccess({ res });
    } catch (e) {
      return responseServerError({ res, err: e.message });
    }
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
}
