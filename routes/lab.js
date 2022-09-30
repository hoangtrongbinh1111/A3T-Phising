const express = require("express");
const router = express.Router();
const cleanBody = require("../middlewares/cleanbody");
const labController = require("../src/lab/lab.controller");

router.post("/create", cleanBody, labController.createLab);
router.get("/read",cleanBody, labController.readLab);
router.put("/update",cleanBody, labController.updateLab);
router.delete("/delete",cleanBody, labController.deleteLab);
module.exports = router;
