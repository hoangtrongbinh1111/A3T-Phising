const express = require("express");
const router = express.Router();


const labController = require("../src/lab/lab.controller");


router.post("/:lab_name",labController.createFolder);

module.exports = router;