const express = require("express");
const router = express.Router();
const cleanBody = require("../middlewares/cleanbody");
const datasetController = require("../src/dataset/Dataset.controller");

router.post("/create", cleanBody, datasetController.createDataset);
router.get("/read",cleanBody, datasetController.readDataset);
router.put("/update",cleanBody, datasetController.updateDataset);
router.delete("/delete",cleanBody, datasetController.deleteDataset);
module.exports = router;
