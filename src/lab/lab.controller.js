const Joi = require("joi");
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
const { LAB_FOLDER, LAB_SUBFOLDER } = require("../../helpers/constant");
const { getDir } = require("../../helpers/file");

const labCreateSchema = Joi.object().keys({
  labName: Joi.string().required(),
  userCreated: Joi.string().required(),
});

const labUpdateSchema = Joi.object().keys({
  labId: Joi.string().required(),
  labName: Joi.string().optional(),
  configPath: Joi.string().optional(),
});

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
    const dir = getDir({ dir: root + `/${LAB_FOLDER}` });
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
    delete result.value.labId;
    let data = await Lab.findOneAndUpdate(req.body.labId, result.value, {
      new: true,
    });
    return responseSuccessWithData({
      res,
      data: data,
    });
  } catch (error) {
    return responseServerError({ res, err: error.message });
  }
};

exports.readLab = async (req, res) => {
  try {
    await Lab.findOne({ labId: req.body.labId }).then((data) => {
      return responseSuccessWithData({ res, data: data });
    });
  } catch (error) {
    return responseServerError({ res, err: error.message });
  }
};

exports.deleteLab = async (req, res) => {
  try {
    await Lab.findOneAndDelete({ labId: req.body.labId }).then(() => {
      return responseSuccess({ res });
    });
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
};
