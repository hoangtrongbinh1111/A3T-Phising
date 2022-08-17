require("dotenv").config();

const Users = require("../src/users/user.model");

async function checkAuthorize(id, res) {
  const user = await Users.findOne({
    userId: id
  });

  if (user.type !== 1) {
    return res.status(400).send({
      status: false,
      message: "Bạn không có quyền thực hiện tác vụ này",
    });
  }
}

module.exports = { checkAuthorize };
