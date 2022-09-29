const express = require("express");
const router = express.Router();
const { validateToken } = require("../middlewares/validateToken");
const cleanBody = require("../middlewares/cleanbody");
const ModelController = require("../src/model/model.controller");

router.get("/", validateToken, ModelController.ListModels);
router.get("/detail", validateToken, ModelController.DetailModel);
router.post("/add", validateToken, cleanBody, ModelController.AddModels);
router.patch("/edit", validateToken, cleanBody, ModelController.EditModel);
router.delete("/delete", validateToken, ModelController.DeleteModel);

module.exports = router;
