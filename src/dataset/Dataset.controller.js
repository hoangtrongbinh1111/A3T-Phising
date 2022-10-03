const Joi = require("joi"); //validate
require("dotenv").config();
const { v4: uuid } = require("uuid"); //gen id
const dataset = require("./Dataset.model");
const {
  responseServerError,
  responseSuccess,
  responseInValid,
  responseSuccessWithData,
} = require("../../helpers/ResponseRequest"); //response server
const path = require("path"); //work with path
const { getDir } = require("../../helpers/file"); // create dir
const { DATA_FOLDER, DATA_SUBFOLDER } = require("../../helpers/constant");
const { VirtualType } = require("mongoose");

const updateDatasetSchema = Joi.object().keys({
  datasetId: Joi.string().required(),
  numTrain: Joi.number().optional(),
  numVal: Joi.number().optional(),
  numTest: Joi.number().optional(),
  dataType: Joi.string().optional(),
  desc: Joi.string().optional(),
});
const datasetCreateSchema = Joi.object().keys({
  userUpload: Joi.string().required(),
  dataName: Joi.string().required()
});
exports.updateDataset = async (req, res) => {
  try {
    const result = updateDatasetSchema.validate(req.body);
    if (result.error) {
      return responseServerError({ res, err: result.error.message });
    }
    delete result.value.datasetId;
    let data = await dataset.findOneAndUpdate(req.body.datasetId, result.value, {
      new: true,
    });
    return responseSuccessWithData({
      res,
      data: data,
    });
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
};
exports.createDataset = async (req, res) => {
  try {
    const result = datasetCreateSchema.validate(req.body);
    if (result.error) {
      return responseServerError({ res, err: result.error.message });
    }
    const { dataName, userUpload } = req.body;
    const datasetId = uuid();
    const savePath = `/${DATA_FOLDER}/${datasetId}`;
    //create folder
    const root = path.resolve("./");
    const dir = getDir({ dir: root + `/${DATA_FOLDER}` });
    const dataDir = getDir({
      dir: root + `/${DATA_FOLDER}/${req.body.dataName}`,
    });
    Object.keys(DATA_SUBFOLDER).map((subfolder) => {
      getDir({
        dir:
          root +
          `/${DATA_FOLDER}/${req.body.dataName}/${DATA_SUBFOLDER[subfolder]}`,
      });
    });
    const data = {
      datasetId,
      dataName,
      userUpload,
      savePath,
    };
    const newData = new dataset(data);
    await newData.save();
    return responseSuccessWithData({ res, data: newData });
  } catch (error) {
    return responseServerError({ res, err: error.message });
  }
};
exports.readDataset = async (req, res) => {
  try {
    await dataset.findOne({ datasetId: req.body.datasetId }).then((data) => {
      return responseSuccessWithData({ res, data: data });
    });
  } catch (error) {
    return responseServerError({ res, err: error.message });
  }
};
exports.deleteDataset = async (req, res) => {
  try {
    await dataset
      .findOneAndDelete({ datasetId: req.body.datasetId })
      .then(() => {
        return responseSuccess({ res });
      });
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
};
