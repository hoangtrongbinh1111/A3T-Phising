const Joi = require("joi");
const { v4: uuid } = require("uuid");
const Model = require("../model/model.model");
const Users = require("../users/user.model");
const { checkAuthorize } = require("../../middlewares/checkAuthorize");
const { responseServerError, responseInValid, responseSuccessWithData } = require("../../helpers/ResponseRequest");

const AddModelSchema = Joi.object().keys({
    urlSaveModel: Joi.string().required(),
    params: Joi.string(),
    desc: Joi.string()
});

const EditModelSchema = Joi.object().keys({
    modelId: Joi.string().required(),
    urlSaveModel: Joi.string(),
    params: Joi.string(),
    desc: Joi.string()
});

exports.ListModels = async (req, res) => {
    try {
        const { id } = req.decoded;
        checkAuthorize(id, res);
        let { search, page, limit } = req.query;
        let options = {
        };
        if (search && search !== "") {
            options = {
                ...options,
                $or: [
                    { modelId: new RegExp(search.toString(), 'i') },
                    { urlSaveModel: new RegExp(search.toString(), 'i') },
                    { params: new RegExp(search.toString(), 'i') },
                    { desc: new RegExp(search.toString(), 'i') },
                ]
            };
        }

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const data = await Model.find(options).skip((page - 1) * limit).limit(limit).lean().exec();
        const total = await Model.find(options).countDocuments();
        return responseSuccessWithData({
            res, data: {
                data,
                total,
                page,
                last_page: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return responseServerError({ res, err: error.message });
    }
};

exports.DetailModel = async (req, res) => {
    try {
        const { id } = req.decoded;
        checkAuthorize(id, res);
        const { modelId } = req.query;
        let modelItem = await Model.findOne({ modelId: modelId });
        if (modelItem) {
            return responseSuccessWithData({ res, data: modelItem });
        }
        return responseServerError({ res, err: "Model không tồn tại!" });
    } catch (error) {
        return responseServerError({ res, err: error.message });
    }
};

exports.AddModels = async (req, res) => {
    try {
        const { id } = req.decoded;
        checkAuthorize(id, res);

        const result = AddModelSchema.validate(req.body);
        if (result.error) {
            return responseServerError({ res, err: result.error.message })
        }

        //Check if the username has been already registered.
        var modelItem = await Model.findOne({
            urlSaveModel: result.value.urlSaveModel,
        });

        if (modelItem) {
            return res.status(400).json({
                status: false,
                message: "Model đã có trong hệ thống!",
            });
        }

        const modelId = uuid();
        result.value.modelId = modelId;

        const newModel = new Model(result.value);
        await newModel.save();

        return res.status(200).json({
            status: true,
            message: "Thêm model thành công!"
        });
    } catch (error) {
        return responseServerError({ res, err: error.message });
    }
};

exports.EditModel = async (req, res) => {
    try {
        const { id } = req.decoded;
        checkAuthorize(id, res);
        const result = EditModelSchema.validate(req.body);
        if (result.error) {
            return responseServerError({ res, err: result.error.message })
        }
        const { modelId, urlSaveModel, params, desc } = req.body;
        //Check if the username has been already registered.
        var modelItem = await Model.findOne({
            modelId: modelId,
        });

        if (!modelItem) {
            return res.status(400).json({
                status: false,
                message: "Model không tồn tại!",
            });
        }
        delete result.value.modelId
        let modelUpdate = await Model.findOneAndUpdate({ modelId: modelId }, result.value, {
            new: true
        }); // return data updated

        return res.status(200).send({ status: true, data: modelUpdate });
    } catch (error) {
        return responseServerError({ res, err: error.message });
    }
};

exports.DeleteModel = async (req, res) => {
    try {
        const { id } = req.decoded;
        checkAuthorize(id, res);

        const { modelId } = req.query;
        //Check if the username has been already registered.
        var modelItem = await Model.findOne({
            modelId: modelId,
        });

        if (!modelItem) {
            return res.status(400).json({
                status: false,
                message: "modelId không tồn tại!",
            });
        }

        await Model.deleteOne({ modelId: modelId }); // return data updated
        return res.status(200).send({ status: true, data: null });
    } catch (error) {
        return responseServerError({ res, err: error.message });
    }
};