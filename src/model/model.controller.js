const Joi = require("joi");
const Model = require("../model/model.model");
const Users = require("../users/user.model");
const { checkAuthorize } = require("../../middlewares/checkAuthorize");

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
            type: 0
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
        return res.status(200).json({
            status: true,
            data,
            total,
            page,
            last_page: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Không thể lấy danh sách mô hình", error);
        return res.status(200).json({
            status: false,
            message: error.message,
        });
    }
};

exports.DetailModel = async (req, res) => {
    try {
        const { id } = req.decoded;
        checkAuthorize(id, res);
        const { modelId } = req.query;
        let modelItem = await Model.findOne({ modelId: modelId });
        if (modelItem) {
            return res.status(200).json({
                status: true, data: modelItem
            });
        }
        else {
            return res.status(200).json({
                status: false, message: "Model không tồn tại!"
            });
        }
    } catch (error) {
        console.error("Không thể lấy thông tin model", error);
        return res.status(200).json({
            status: false,
            message: error.message,
        });
    }
};

exports.AddModels = async (req, res) => {
    try {
        const { id } = req.decoded;
        checkAuthorize(id, res);

        const result = AddModelSchema.validate(req.body);
        if (result.error) {
            console.log(result.error.message);
            return res.status(400).json({
                status: false,
                message: result.error.message,
            });
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

        const modelId = uuid(); //Generate unique id for blacklist.
        result.value.modelId = modelId;

        const newModel = new Model(result.value);
        await newModel.save();

        return res.status(200).json({
            status: true,
            message: "Thêm model thành công!"
        });
    } catch (error) {
        console.error("add-error", error);
        return res.status(200).json({
            status: false,
            message: "Thêm model thất bại!",
        });
    }
};

exports.EditModel = async (req, res) => {
    try {
        const { id } = req.decoded;
        checkAuthorize(id, res);
        const result = EditModelSchema.validate(req.body);
        if (result.error) {
            console.log(result.error.message);
            return res.status(400).json({
                status: false,
                message: result.error.message,
            });
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
        console.error("add-error", error);
        return res.status(200).json({
            status: false,
            message: "Cập nhật vào model thất bại!",
        });
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

        await BlackList.deleteOne({ modelId: modelId }); // return data updated
        return res.status(200).send({ status: true, data: null });
    } catch (error) {
        console.error("delete-error", error);
        return res.status(200).json({
            status: false,
            message: "Xóa model thất bại!",
        });
    }
};