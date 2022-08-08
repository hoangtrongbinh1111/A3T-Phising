const Joi = require("joi");
require("dotenv").config();
const { v4: uuid } = require("uuid");
const { customAlphabet: generate } = require("nanoid");

const { generateJwt, generateOnlyJwt } = require("./helpers/generateJwt");
const { verifyRefreshToken } = require("./helpers/verifyRefreshToken");
const User = require("./user.model");

//Validate user schema
const userSchema = Joi.object().keys({
  fullname: Joi.string()
    .min(3)
    .max(30)
    .required(),
  phoneNumber: Joi.string().min(8).max(10).pattern(/^[0-9]+$/).required(),
  email: Joi.string().email({ minDomainSegments: 2 }),
  username: Joi.string().required().min(6),
  password: Joi.string().required().min(4),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required()
});

const EditUserSchema = Joi.object().keys({
  fullname: Joi.string()
    .min(3)
    .max(30),
  phoneNumber: Joi.string().min(8).max(10).pattern(/^[0-9]+$/),
  email: Joi.string().email({ minDomainSegments: 2 }),
});

const refreshTokenBodyValidation = Joi.object().keys({
  refreshToken: Joi.string().required()
});

exports.Signup = async (req, res) => {
  try {
    const result = userSchema.validate(req.body);
    if (result.error) {
      console.log(result.error.message);
      return res.json({
        status: false,
        status: 400,
        message: result.error.message,
      });
    }

    //Check if the username has been already registered.
    var user = await User.findOne({
      username: result.value.username,
    });

    if (user) {
      return res.json({
        status: false,
        message: "Username đã được sử dụng",
      });
    }

    const hash = await User.hashPassword(result.value.password);

    const id = uuid(); //Generate unique id for the user.
    result.value.userId = id;

    delete result.value.confirmPassword;
    result.value.password = hash;

    const newUser = new User(result.value);
    await newUser.save();

    return res.status(200).json({
      status: true,
      message: "Đăng kí thành công"
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(200).json({
      status: false,
      message: "Đăng kí thất bại",
    });
  }
};

exports.Activate = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.json({
        status: false,
        status: 200,
        message: "Tài khoản chưa được kích hoạt!",
      });
    }
    const user = await User.findOne({
      username: username,
    });

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "Thông tin người dùng không hợp lệ",
      });
    } else {
      if (user.active)
        return res.send({
          status: false,
          message: "Tài khoản đã được kích hoạt",
          status: 200,
        });

      user.active = true;
      await user.save();
      return res.status(200).json({
        status: true,
        message: "Kích hoạt tài khoản thành công.",
      });
    }
  } catch (error) {
    console.error("activation-error", error);
    return res.status(200).json({
      status: false,
      message: error.message,
    });
  }
};

exports.Login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: false,
        message: "Không thể xác thực người dùng.",
      });
    }

    //1. Find if any account with that username exists in DB
    const user = await User.findOne({ username: username });

    // NOT FOUND - Throw error
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Tài khoản không tồn tại",
      });
    }

    //2. Throw error if account is not activated
    if (!user.active) {
      return res.status(400).json({
        status: false,
        message: "Bạn cần kích hoạt tài khoản",
      });
    }

    //3. Verify the password is valid
    const isValid = await User.comparePasswords(password, user.password);

    if (!isValid) {
      return res.status(200).json({
        status: false,
        message: "Sai mật khẩu",
      });
    }

    //Generate Access token

    const { error, token, refreshToken } = await generateJwt({ username: user.username, id: user.userId });
    if (error) {
      return res.status(200).json({
        status: false,
        message: "Không thể tạo token vui lòng thử lại sau",
      });
    };
    user.accessToken = token;
    user.refreshToken = refreshToken;
    await user.save();

    //Success
    return res.send({
      status: true,
      message: "Đăng nhập thành công",
      accessToken: token,
      refreshToken: refreshToken
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(200).json({
      status: false,
      message: "Đăng nhập thất bại. Vui lòng thử lại sau.",
    });
  }
};

exports.RefreshToken = async (req, res) => {
  try {
    const { id } = req.decoded;
    const user = await User.findOne({ userId: id });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Tài khoản không tồn tại",
      });
    }

    verifyRefreshToken(user.refreshToken).then(async ({ tokenDetails }) => {
      const payload = { username: tokenDetails.username, id: tokenDetails.id }
      const response = await generateOnlyJwt(payload);
      if (response.status) {
        return res.status(200).json({
          status: true,
          accessToken: response.token,
          refreshToken: user.refreshToken,
          message: "Tạo token thành công!",
        });
      }
      else {
        return res.status(401).json({
          status: false,
          message: response.message,
        });
      }
    }).catch((err) => res.status(400).json(err));
  } catch (err) {
    console.error("Create error", err);
    return res.status(200).json({
      status: false,
      message: "Không thể tạo mới token! Vui lòng đăng nhập lại!",
    });
  }
};

exports.ResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword || !confirmPassword) {
      return res.status(403).json({
        status: false,
        message:
          "Không thể thực hiện yêu cầu. Vui lòng điền hết các thông tin",
      });
    }
    const user = await User.findOne({
      resetPasswordToken: req.body.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.send({
        status: false,
        message: "Password reset token is invalid or has expired.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Mật khẩu mới không khớp",
      });
    }
    const hash = await User.hashPassword(req.body.newPassword);
    user.password = hash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = "";

    await user.save();

    return res.send({
      status: true,
      message: "Mật khẩu đã được thay đổi",
    });
  } catch (error) {
    console.error("reset-password-error", error);
    return res.status(200).json({
      status: false,
      message: error.message,
    });
  }
};

exports.ChangePassword = async (req, res) => {
  try {
    const { id } = req.decoded;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(403).json({
        status: false,
        message:
          "Không thể thực hiện yêu cầu. Vui lòng điền hết các thông tin",
      });
    }
    const user = await User.findOne({
      userId: id
    });
    if (!user) {
      return res.send({
        status: false,
        message: "Người dùng không tồn tại.",
      });
    }

    const isValid = await User.comparePasswords(oldPassword, user.password);

    if (!isValid) {
      return res.status(400).json({
        status: false,
        message: "Mật khẩu không chính xác",
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        status: false,
        message: "Mật khẩu mới cần khác mật khẩu cũ",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Mật khẩu mới không khớp",
      });
    }
    const hash = await User.hashPassword(newPassword);
    user.password = hash;

    await user.save();

    return res.send({
      status: true,
      message: "Mật khẩu đã được thay đổi",
    });
  } catch (error) {
    console.error("reset-password-error", error);
    return res.status(200).json({
      status: false,
      message: error.message,
    });
  }
};

exports.Logout = async (req, res) => {
  try {
    const { id } = req.decoded;

    let user = await User.findOne({ userId: id });
    user.accessToken = "";
    user.refreshToken = "";
    await user.save();

    return res.send({ status: true, message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("user-logout-error", error);
    return res.stat(200).json({
      status: false,
      message: error.message,
    });
  }
};

exports.GetUserDetail = async (req, res) => {
  try {
    const { id } = req.decoded;

    let user = await User.findOne({ userId: id });
    return res.send({
      status: true, data: {
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        phoneNumber: user.phoneNumber,
      }
    });
  } catch (error) {
    console.error("user-logout-error", error);
    return res.stat(200).json({
      status: false,
      message: error.message,
    });
  }
};

exports.EditUser = async (req, res) => {
  try {
    const { id } = req.decoded;

    const result = EditUserSchema.validate(req.body);
    if (result.error) {
      console.log(result.error.message);
      return res.json({
        status: false,
        status: 400,
        message: result.error.message,
      });
    }

    let user = await User.findOneAndUpdate({ userId: id }, req.body, {
      new: true
    }); // return data updated

    return res.send({
      status: true, data: {
        fullname: user.fullname,
        phoneNumber: user.phoneNumber,
        email: user.email,
        userId: user.userId
      }
    });
  } catch (error) {
    console.error("user-logout-error", error);
    return res.stat(200).json({
      status: false,
      message: error.message,
    });
  }
};
