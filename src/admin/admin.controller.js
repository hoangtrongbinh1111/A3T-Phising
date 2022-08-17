const Joi = require("joi");
const Users = require("../users/user.model");
const { responseServerError, responseInValid, responseSuccessWithData } = require("../../helpers/ResponseRequest");
const { checkAuthorize } = require("../../middlewares/checkAuthorize");

exports.ListUsers = async (req, res) => {
  try {
    const { id } = req.decoded;
    checkAuthorize(id, res);
    let { search, page, limit, from_time, to_time } = req.query;
    let options = {
      type: 0
    };
    if (search && search !== "") {
      options = {
        ...options,
        $or: [
          { fileName: new RegExp(search.toString(), 'i') },
          { phoneNumber: new RegExp(search.toString(), 'i') },
          { email: new RegExp(search.toString(), 'i') },
          { username: new RegExp(search.toString(), 'i') },
        ]
      };
    }
    if (from_time && to_time) {
      options = {
        ...options,
        createdAt: {
          $gte: new Date(from_time).toISOString(),
          $lt: new Date(to_time).toISOString()
        }
      }
    }

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const data = await Users.find(options, { userId: 1, fullname: 1, phoneNumber: 1, email: 1, active: 1, username: 1 }).skip((page - 1) * limit).limit(limit).lean().exec();
    const total = await Users.find(options).countDocuments();
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

exports.BlockUser = async (req, res) => {
  try {
    const { id } = req.decoded;
    checkAuthorize(id, res);

    const { username, isActive } = req.body;
    if (!username) {
      return responseServerError({ res, err: "Không thể xác thực người dùng!" });
    }

    //1. Find if any account with that username exists in DB
    const user = await Users.findOne({ username: username });

    // NOT FOUND - Throw error
    if (!user) {
      return responseServerError({ res, err: "Tài khoản không tồn tại" });
    }
    user.active = isActive === 1;
    await user.save();
    //Success
    return responseSuccessWithData({ res, data: `${isActive === 1 ? "Mở khóa" : "Khóa"} người dùng thành công` });
  } catch (err) {
    return responseServerError({ res, err: err.message });
  }
};