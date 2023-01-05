const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
require("dotenv").config();
const Lab = require("./src/lab/lab.model");
const Log = require("./src/log/log.model");
const Model = require("./src/model/model.model");
const Dataset = require("./src/dataset/Dataset.model");
const { v4: uuid } = require("uuid"); //gen id
const { DATA_FOLDER,DATA_SUBFOLDER} = require('./helpers/constant')
const {getDir,removeDir} = require('./helpers/file')
const dataRoutes = require("./routes/dataset");
const labRoutes = require("./routes/lab");
const authRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const logRoutes = require("./routes/log");
const blacklistRoutes = require("./routes/blacklist");
const modelRoutes = require("./routes/model");
const {responseServerError,ResponseSuccess,responseSuccessWithData, responseSuccess} = require("./helpers/ResponseRequest")
const Joi = require("joi"); //validate

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Database connection Success.");
  })
  .catch((err) => {
    console.error("Mongo Connection Error", err);
  });

const app = express();
const http = require("http");
const server = http.createServer(app);
// const { Server } = require("socket.io");
// const _io = new Server(server);
var _io = require("socket.io")(server, {
  pingTimeout: 99999999,
  pingInterval: 99999999,
  cors: {
    origin: "*",
  },
  secure: true
});

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

(async () => {
  // socket
  _io.on("connection", (socket) => {
    //=======TRAIN======
    socket.on("start_train_model", async (data) => {
      const {config, logId} = await Lab.findOne({ labId: data.labId });
      const modelData = await Model.findOne({ modelId: config.modelId });
      const datasetData = await Dataset.findOne({ datasetId: config.datasetId });
      const trainId = data.sid;
      await _io.emit(`start_training`, {
        data_dir: `${datasetData.savePath}/train.csv`,
        learning_rate: config.learning_rate,
        epochs: config.epochs,
        batch_size: config.batch_size, 
        val_size: config.val_size,
        model_type: modelData.modelName,
        labId: data.labId,
        trainId: trainId
      });
      const dataTrainProcess = {
        trainId,
        trainProcess: []
      }
      await Log.findOneAndUpdate(
        { logId: logId  }, 
        { $push: { trainHistory: dataTrainProcess }})
    });
    socket.on(`receive_training_process`, async (data) => {
      const dataRecieve = JSON.parse(data);
      await _io.emit(`send_training_result_${dataRecieve["labId"]}`, dataRecieve["response"]);
      let {logId} = await Lab.findOne({ labId: dataRecieve["labId"] });
      await Log.findOneAndUpdate(
        { logId: logId, "trainHistory.trainId": dataRecieve["trainId"] }, 
        { $push: { "trainHistory.$.trainProcess": dataRecieve["response"] } }
      );
    });
    //=======TRAINED======
    //=======TEST======
    socket.on("start_test_model", async (data) => {
      const {config, logId} = await Lab.findOne({ labId: data.labId });
      const modelData = await Model.findOne({ modelId: config.modelId });
      const datasetData = await Dataset.findOne({ datasetId: config.datasetId });
      const testId = data.sid;
      await _io.emit(`start_testing`, {
        test_data_dir: `${datasetData.savePath}/test.csv`, 
        ckpt_number: data.epoch_selected,
        model_type: modelData.modelName,
        labId: data.labId,
        testId: testId
      });
      const dataTestProcess = {
        testId,
        testProcess: []
      };
      await Log.findOneAndUpdate(
        { logId: logId  }, 
        { $push: { testHistory: dataTestProcess }});
    });

    socket.on(`receive_testing_process`, async (data) => {
      const dataRecieve = JSON.parse(data);
      await _io.emit(`send_testing_result_${dataRecieve["labId"]}`, dataRecieve["response"]);
      let {logId} = await Lab.findOne({ labId: dataRecieve["labId"] });
      await Log.findOneAndUpdate(
        { logId: logId, "testHistory.testId": dataRecieve["testId"] }, 
        { $push: { "testHistory.$.testProcess": dataRecieve["response"] } }
      );
    });
    //=======TESTED======

    //=======INFER======
    socket.on("start_infer_model", async (data) => {
      const {config, logId} = await Lab.findOne({ labId: data.labId });
      const modelData = await Model.findOne({ modelId: config.modelId });
      const inferId = data.sid;
      await _io.emit(`start_infering`, {
        url_sample: data.url, 
        ckpt_number: data.epoch_selected,
        model_type: modelData.modelName,
        labId: data.labId,
        inferId: inferId
      });
      const dataInferProcess = {
        inferId,
        inferProcess: []
      };
      await Log.findOneAndUpdate(
        { logId: logId  }, 
        { $push: { inferHistory: dataInferProcess }});
    });

    socket.on(`receive_infering_process`, async (data) => {
      const dataRecieve = JSON.parse(data);
      await _io.emit(`send_infering_result_${dataRecieve["labId"]}`, dataRecieve["response"]);
      let {logId} = await Lab.findOne({ labId: dataRecieve["labId"] });
      await Log.findOneAndUpdate(
        { logId: logId, "inferHistory.inferId": dataRecieve["inferId"] }, 
        { $push: { "inferHistory.$.inferProcess": dataRecieve["response"] } }
      );
    });
    //=======INFERED======
  });
  
  app.get("/ping", (req, res) => {
    return res.status(200).send({
      status: true,
      message: "Server is healthy",
    });
  });


  // SET STORAGE, UPLOAD DATA
  const datasetCreateSchema = Joi.object().keys({
    userUpload: Joi.string().required(),
    dataName: Joi.string().required(),
  });
  const whitelist = [
    'text/csv'
  ]
  const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
      const result = datasetCreateSchema.validate(req.body);
      if (result.error) {
        return cb(new Error(result.error.message));
      }
      cb(null, `./${DATA_FOLDER}/${req.query.datasetId}/${DATA_SUBFOLDER['uploadsFolder']}`);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
    // fileFilter: (req, file, cb) => {
    //   if (!whitelist.includes(file.mimetype)) {
    //     return cb(new Error('file is not allowed'))
    //   }
    //   cb(null, true)
    // }
  });
  const upload = multer({ storage: storage }).array("files", 2);

  app.post("/api/v1/dataset/upload", async (req, res, next) => {
    
    try {
      const datasetId = uuid();
      let savePath = `/${DATA_FOLDER}/${datasetId}/${DATA_SUBFOLDER["uploadsFolder"]}`;
      // create folder
      const root = path.resolve("./");
      const datasetDir = getDir({ dir: root + `/${DATA_FOLDER}/${datasetId}` });
      getDir({ dir: root + savePath });
      savePath = `./${DATA_FOLDER}/${datasetId}/${DATA_SUBFOLDER["uploadsFolder"]}`;

      // done create
      req.query.datasetId = datasetId;
      upload(req,res,async function(err) {
        if(err) {
          return responseServerError({ res, err: "Error uploading file." });
        }
        const { userUpload, dataName } = req.body;
        //end create folder
        const data = {
            datasetId,
            dataName,
            userUpload,
            savePath
        };
        const newData = new Dataset(data);
        await newData.save();

        return responseSuccess({ res });
    });
    } catch (err) {
      return responseServerError({ res, err: "Error uploading file1." });
    }
  });

  app.use("/api/v1/data", dataRoutes);
  app.use("/api/v1/lab", labRoutes);
  app.use("/api/v1/users", authRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/log", logRoutes);
  app.use("/api/v1/blacklist", blacklistRoutes);
  app.use("/api/v1/model", modelRoutes);

  const PORT = process.env.PORT || 8686;
  server.listen(PORT, "api-service", () => {
    console.log("Server started listening on PORT : " + PORT);
  });
})();
