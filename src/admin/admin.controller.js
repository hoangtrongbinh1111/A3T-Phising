const Joi = require("joi");
const Users = require("../users/user.model");

exports.ListUsers = async (req, res) => {
  try {
    const { id } = req.decoded;
    const user = await Users.findOne({
      userId: id
    });
   
    if (user.type !== 1) {
      return res.send({
        status: false,
        message: "Bạn không có quyền thực hiện tác vụ này",
      });
    }
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
    const data = await Users.find(options).skip((page - 1) * limit).limit(limit).lean().exec();
    const total = await Users.find(options).countDocuments();
    return res.status(200).json({
      status: true,
      data,
      total,
      page,
      last_page: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Không thể lấy danh sách người dùng", error);
    return res.status(200).json({
      status: false,
      message: error.message,
    });
  }
};

exports.BlockUser = async (req, res) => {
  try {
    const { id } = req.decoded;
    const userCheck = await Users.findOne({
      userId: id
    });
   
    if (userCheck.type !== 1) {
      return res.send({
        status: false,
        message: "Bạn không có quyền thực hiện tác vụ này",
      });
    }

    const { username, isActive } = req.body;
    if (!username) {
      return res.status(400).json({
        status: false,
        message: "Không thể xác thực người dùng.",
      });
    }

    //1. Find if any account with that username exists in DB
    const user = await Users.findOne({ username: username });

    // NOT FOUND - Throw error
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Tài khoản không tồn tại",
      });
    }
    user.active = isActive === 1;
    await user.save();
    //Success
    return res.send({
      status: true,
      message: `${isActive === 1 ? "Mở khóa" : "Khóa"} người dùng thành công`,
    });
  } catch (err) {
    console.error("Block error", err);
    return res.status(200).json({
      status: false,
      message: "Xóa người dùng thất bại, vui lòng thử lại.",
    });
  }
};