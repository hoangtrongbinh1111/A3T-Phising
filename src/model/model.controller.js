const Joi = require("joi");
const { v4: uuid } = require("uuid");
const Model = require("../model/model.model");
const Users = require("../users/user.model");
const { checkAuthorize } = require("../../middlewares/checkAuthorize");
const {
  responseServerError,
  responseInValid,
  responseSuccess,
  responseSuccessWithData,
} = require("../../helpers/ResponseRequest");

const createModelSchema = Joi.object().keys({
  modelName: Joi.string().required(),
  algorithmName: Joi.string().required(),
  userCreated: Joi.string().required(),
});
const updateModelSchema = Joi.object().keys({
  modelId: Joi.string().required(),
  modelName: Joi.string(),
  algorithmName: Joi.string(),
  userCreated: Joi.string(),
});

exports.createModel = async (req, res) => {
  try {
    const result = createModelSchema.validate(req.body);
    if (result.error) {
      return responseServerError({ res, err: result.error.message });
    }
    const { modelName, algorithmName, userCreated } = req.body;

    result.value.modelId = uuid();
    const newModel = new Model(result.value);
    await newModel.save();
    return responseSuccessWithData({ res, data: newModel });
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
};
exports.updateModel = async (req, res) => {
  try {
    const result = updateModelSchema.validate(req.body);
    if (result.error) {
      return responseServerError({ res, err: result.error.message });
    }
    delete result.value.modelId;
    let data = await Model.findOneAndUpdate(req.body.modelId, result.value, {
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
exports.readModel = async (req, res) => {
  try {
    await Model.findOne({ labId: req.body.labId }).then((data) => {
      return responseSuccessWithData({ res, data: data });
    });
  } catch (error) {
    return responseServerError({ res, err: error.message });
  }
};
exports.deleteModel = async (req, res) => {
  try {
    await Model.findOneAndDelete({ labId: req.body.labId }).then(() => {
      return responseSuccess({ res });
    });
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
};
