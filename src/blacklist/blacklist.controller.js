const Joi = require("joi");
require("dotenv").config();
const { v4: uuid } = require("uuid");

const Users = require("../users/user.model");
const BlackList = require("./blacklist.model");

const AddBlackListSchema = Joi.object().keys({
    url: Joi.string().required(),
    type: Joi.string()
});

const EditBlackListSchema = Joi.object().keys({
    blacklistId: Joi.string().required(),
    url: Joi.string(),
    type: Joi.string()
});

exports.ListBlackLists = async (req, res) => {
    try {
        const { id } = req.decoded;
        const user = await Users.findOne({
            userId: id
        });

        if (user.type !== 1) {
            return res.status(400).send({
                status: false,
                message: "Bạn không có quyền thực hiện tác vụ này",
            });
        }
        let { search, page, limit, from_time, to_time } = req.query;
        let options = {};
        if (search && search !== "") {
            options = {
                ...options,
                $or: [
                    { url: new RegExp(search.toString(), 'i') },
                    { type: new RegExp(search.toString(), 'i') },
                ]
            };
        }
        if (from_time && to_time) {
            options = {
                ...options,
                create_At: {
                    $gte: new Date(from_time).toISOString(),
                    $lt: new Date(to_time).toISOString()
                }
            }
        }

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const data = await BlackList.find(options).skip((page - 1) * limit).limit(limit).lean().exec();
        const total = await BlackList.find(options).countDocuments();
        return res.status(200).json({
            status: true,
            data,
            total,
            page,
            last_page: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Không thể lấy danh sách blacklist", error);
        return res.status(200).json({
            status: false,
            message: error.message,
        });
    }
};

exports.DetailBlackLists = async (req, res) => {
    try {
        const { id } = req.decoded;
        const user = await Users.findOne({
            userId: id
        });

        if (user.type !== 1) {
            return res.status(400).send({
                status: false,
                message: "Bạn không có quyền thực hiện tác vụ này",
            });
        }
        const { blacklistId } = req.query;
        let blItem = await BlackList.findOne({ blacklistId: blacklistId });
        if (blItem) {
            return res.status(200).json({
                status: true, data: blItem
            });
        }
        else {
            return res.status(200).json({
                status: false, message: "Blacklist không tồn tại!"
            });
        }
    } catch (error) {
        console.error("Không thể lấy thông tin blacklist", error);
        return res.status(200).json({
            status: false,
            message: error.message,
        });
    }
};

exports.AddBlackList = async (req, res) => {
    try {
        const { id } = req.decoded;
        const user = await Users.findOne({
            userId: id
        });

        if (user.type !== 1) {
            return res.status(400).send({
                status: false,
                message: "Bạn không có quyền thực hiện tác vụ này",
            });
        }

        const result = AddBlackListSchema.validate(req.body);
        if (result.error) {
            console.log(result.error.message);
            return res.status(400).json({
                status: false,
                message: result.error.message,
            });
        }

        //Check if the username has been already registered.
        var blList = await BlackList.findOne({
            url: result.value.url,
        });

        if (blList) {
            return res.status(400).json({
                status: false,
                message: "Url đã có trong hệ thống!",
            });
        }

        const blacklistId = uuid(); //Generate unique id for blacklist.
        result.value.blacklistId = blacklistId;

        const newBlList = new BlackList(result.value);
        await newBlList.save();

        return res.status(200).json({
            status: true,
            message: "Thêm 1 đường dẫn độc hại vào BlackList thành công!"
        });
    } catch (error) {
        console.error("add-error", error);
        return res.status(200).json({
            status: false,
            message: "Thêm vào BlackList thất bại!",
        });
    }
};

exports.EditBlackList = async (req, res) => {
    try {
        const { id } = req.decoded;
        const user = await Users.findOne({
            userId: id
        });

        if (user.type !== 1) {
            return res.status(400).send({
                status: false,
                message: "Bạn không có quyền thực hiện tác vụ này",
            });
        }

        const result = EditBlackListSchema.validate(req.body);
        if (result.error) {
            console.log(result.error.message);
            return res.status(400).json({
                status: false,
                message: result.error.message,
            });
        }
        const { blacklistId, url, type } = req.body;
        //Check if the username has been already registered.
        var blacklistItem = await BlackList.findOne({
            blacklistId: blacklistId,
        });

        if (!blacklistItem) {
            return res.status(400).json({
                status: false,
                message: "blacklistId không tồn tại!",
            });
        }
        delete result.value.blacklistId
        let blUpdate = await BlackList.findOneAndUpdate({ blacklistId: blacklistId }, result.value, {
            new: true
        }); // return data updated

        return res.status(200).send({ status: true, data: blUpdate });
    } catch (error) {
        console.error("add-error", error);
        return res.status(200).json({
            status: false,
            message: "Cập nhật vào BlackList thất bại!",
        });
    }
};

exports.DeleteBlackList = async (req, res) => {
    try {
        const { id } = req.decoded;
        const user = await Users.findOne({
            userId: id
        });

        if (user.type !== 1) {
            return res.status(400).send({
                status: false,
                message: "Bạn không có quyền thực hiện tác vụ này",
            });
        }

        const { blacklistId } = req.query;
        //Check if the username has been already registered.
        var blacklistItem = await BlackList.findOne({
            blacklistId: blacklistId,
        });

        if (!blacklistItem) {
            return res.status(400).json({
                status: false,
                message: "blacklistId không tồn tại!",
            });
        }

        await BlackList.deleteOne({ blacklistId: blacklistId }); // return data updated
        return res.status(200).send({ status: true, data: null });
    } catch (error) {
        console.error("delete-error", error);
        return res.status(200).json({
            status: false,
            message: "Xóa BlackList thất bại!",
        });
    }
};