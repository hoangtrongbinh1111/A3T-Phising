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
const {responseServerError,ResponseSuccess,responseSuccessWithData} = require("./helpers/ResponseRequest")
const datasetSchema = require("./src/dataset/Dataset.controller")
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
      console.log(logId);
      await _io.emit(`start_training`, {
        data_dir: "data/train.csv",
        learning_rate: config.learning_rate,
        epochs: config.epochs,
        batch_size: config.batch_size, 
        val_size: config.val_size,
        model_type: modelData.modelName,
        labId: data.labId 
      });
    });
    socket.on(`receive_training_process`, async (data) => {
      const dataRecieve = JSON.parse(data);
      await _io.emit(`send_training_result_${dataRecieve["labId"]}`, dataRecieve["response"]);
      let {logId} = await Lab.findOne({ labId: dataRecieve["labId"] });
      await Log.findOneAndUpdate(
        { logId: logId }, 
        { $push: { trainHistory: dataRecieve["response"] } }
    );
    });
    //=======TRAINED======
    //=======TEST======
    socket.on("start_test_model", async (data) => {
      console.log(socket.id);
      var pklPath = await Lab.findOne({datasetId: data.datasetId},"savePath")
      _io.emit(`start_testing`, {
        test_data_dir: "data/test.csv", 
        ckpt_number: 1,
        model_type: "lstm",
        labId: data.labId
      });
    });

    socket.on(`receive_testing_process`, async (data) => {
      const dataRecieve = JSON.parse(data);
      await _io.emit(`send_testing_result_${dataRecieve["labId"]}`, dataRecieve["response"]);
      let {logId} = await Lab.findOne({ labId: dataRecieve["labId"] });
      await Log.findOneAndUpdate(
        { logId: logId }, 
        { $push: { testHistory: dataRecieve["response"] } })
    });
    //=======TESTED======

    //=======INFER======
    socket.on("start_infer_model", async (data) => {
      console.log(socket.id);
      var config = await Lab.findOne({ labId: data.labId }, "config");
      _io.emit(`start_infering`, {
        url_sample: "http://www.dvdsreleasedates.com/top-movies.php", 
        ckpt_number: 1,
        model_type: "lstm",
        labId: data.labId
      });
    });

    socket.on(`receive_infering_process`, async (data) => {
      const dataRecieve = JSON.parse(data);
      await _io.emit(`send_infering_result_${dataRecieve["labId"]}`, dataRecieve["response"]);
      let {logId} = await Lab.findOne({ labId: dataRecieve["labId"] });
      await Log.findOneAndUpdate(
        { logId: logId }, 
        { $push: { inferenceHistory: dataRecieve["response"] } })
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
  const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        // const result = datasetCreateSchema.validate(req.body);
        // if (result.error) {
        // }
        // const { dataName, userUpload } = req.body;
        const datasetId = uuid();
        
        // const savePath = `${DATA_FOLDER}/${datasetId}/${DATA_SUBFOLDER['uploadsFolder']}/data.csv`;
        // //create folder
        // const root = path.resolve("./");
        // // const dir = getDir({ dir: root + `/${DATA_FOLDER}` });
        // const dataDir = getDir({
        //     dir: root + `/${DATA_FOLDER}/${datasetId}`,
        // });
        // Object.keys(DATA_SUBFOLDER).map((subfolder) => {
        //     getDir({
        //         dir: root + `/${DATA_FOLDER}/${datasetId}/${DATA_SUBFOLDER[subfolder]}`,
        //     });
        // });
        // //end create folder
        // const data = {
        //     datasetId,
        //     dataName,
        //     userUpload,
        //     savePath,
        // };
        // const newData = new dataset(data);
        // await newData.save();

        cb(null, `./${DATA_FOLDER}/${datasetId}/${DATA_SUBFOLDER['uploadsFolder']}` );
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname);
    },
  });
  const upload = multer({ storage: storage }).array("files", 2);

  app.post("/api/v1/admin/uploadFile", async (req, res, next) => {
    upload(req,res,function(err) {
      if(err) {
          return res.end("Error uploading file.");
      }
      res.end("File is uploaded");
  });
  });

  app.use("/api/v1/data", dataRoutes);
  app.use("/api/v1/lab", labRoutes);
  app.use("/api/v1/users", authRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/log", logRoutes);
  app.use("/api/v1/blacklist", blacklistRoutes);
  app.use("/api/v1/model", modelRoutes);

  const PORT = process.env.PORT || 8686;
  server.listen(PORT, "0.0.0.0", () => {
    console.log("Server started listening on PORT : " + PORT);
  });
})();
