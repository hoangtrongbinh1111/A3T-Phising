const express = require("express");
const router = express.Router();
const cleanBody = require("../middlewares/cleanbody");
const labController = require("../src/lab/lab.controller");

router.post("/create", cleanBody, labController.createLab);

module.exports = router;
