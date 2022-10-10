const express = require("express");
const router = express.Router();
const cleanBody = require("../middlewares/cleanbody");
const labController = require("../src/lab/lab.controller");

router.get("/", cleanBody, labController.listLab);
router.post("/create", cleanBody, labController.createLab);
router.get("/read", cleanBody, labController.readLab);
router.patch("/update", cleanBody, labController.updateLab);
router.delete("/delete", cleanBody, labController.deleteLab);
module.exports = router;
