const express = require("express");
const router = express.Router();

const cleanBody = require("../middlewares/cleanbody");
const { validateToken } = require("../middlewares/validateToken");

const LogController = require("../src/log/log.controller");

router.get("/list", validateToken, LogController.ListLogs);

module.exports = router;