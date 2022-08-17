const Joi = require("joi");
require("dotenv").config();
const { v4: uuid } = require("uuid");

const Users = require("../users/user.model");
const Log = require("./log.model");
exports.ListLogs = async (req, res) => {
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
        let { search, page, limit, from_time, to_time, userId } = req.query;
        let options = {};
        if (userId && search !== "") {
            options = {
                ...options,
                userId: userId
            }
        }
        if (search && search !== "") {
            options = {
                ...options,
                $or: [
                    { url: new RegExp(search.toString(), 'i') },
                    { result: new RegExp(search.toString(), 'i') },
                    { userId: new RegExp(search.toString(), 'i') },
                ]
            };
        }
        if (from_time && to_time) {
            options = {
                ...options,
                timeExecute: {
                    $gte: new Date(from_time).toISOString(),
                    $lt: new Date(to_time).toISOString()
                }
            }
        }

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const data = await Log.find(options).skip((page - 1) * limit).limit(limit).lean().exec();
        const total = await Log.find(options).countDocuments();
        return res.status(200).json({
            status: true,
            data,
            total,
            page,
            last_page: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Không thể lấy danh sách log", error);
        return res.status(200).json({
            status: false,
            message: error.message,
        });
    }
};