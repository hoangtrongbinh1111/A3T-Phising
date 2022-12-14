const express = require("express");
const router = express.Router();
const cleanBody = require("../middlewares/cleanbody");
const labController = require("../src/lab/lab.controller");

router.get("/", cleanBody, labController.listLab);
router.post("/create", cleanBody, labController.createLab);
router.get("/read", cleanBody, labController.readLab);
router.patch("/edit", cleanBody, labController.updateLab);
router.delete("/delete", cleanBody, labController.deleteLab);
//api user chọn mô hình và tập dữ liệu
router.patch("/edit/md&dt",cleanBody,labController.editModelAndDatasetLab);
//api user cấu hình 
router.get("/config",cleanBody,labController.getConfig);
router.patch("/edit/config",cleanBody,labController.editModelDataAndConfig)
module.exports = router;
