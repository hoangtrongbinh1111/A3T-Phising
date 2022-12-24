const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
require("dotenv").config();
const Lab = require("./src/lab/lab.model");
const dataset = require("./src/dataset/Dataset.model");
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
      console.log(socket.id);
      var config = await Lab.findOne({ labId: data.labId }, "config");
      var pklPath = await Lab.findOne({datasetId: data.datasetId},"savePath")
      await _io.emit(`start_training`, {
        data_dir: "data/train.csv",
        learning_rate: 0.001,
        epochs: 2,
        batch_size: 8, 
        val_size: 0.2,
        model_type: "lstm",
        sid: data.sid,
        labId: data.labId
      });
    });
    socket.on(`receive_training_process`, async (data) => {
      const temp = JSON.parse(data);
      console.log(temp);
      await _io.emit(`send_training_result_${temp["sid"]}`, temp["response"]);
      console.log("receive_training_process: ", temp["response"]);
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
        sid: data.sid,
        labId: data.labId
      });
    });

    socket.on(`receive_testing_process`, async (data) => {
      const temp = JSON.parse(data);
      console.log(temp);
      await _io.emit(`send_testing_result_${temp["sid"]}`, temp["response"]);
      console.log("receive_testing_process: ", temp["response"]);
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
        sid: data.sid,
        labId: data.labId
      });
    });

    socket.on(`receive_infering_process`, async (data) => {
      const temp = JSON.parse(data);
      console.log(temp);
      await _io.emit(`send_infering_result_${temp["sid"]}`, temp["response"]);
      console.log("receive_infering_process: ", temp["response"]);
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
        const result = datasetCreateSchema.validate(req.body);
        if (result.error) {
        }
        const { dataName, userUpload } = req.body;
        const datasetId = uuid();
        
        const savePath = `${DATA_FOLDER}/${datasetId}/${DATA_SUBFOLDER['uploadsFolder']}/data.csv`;
        //create folder
        const root = path.resolve("./");
        // const dir = getDir({ dir: root + `/${DATA_FOLDER}` });
        const dataDir = getDir({
            dir: root + `/${DATA_FOLDER}/${datasetId}`,
        });
        Object.keys(DATA_SUBFOLDER).map((subfolder) => {
            getDir({
                dir: root + `/${DATA_FOLDER}/${datasetId}/${DATA_SUBFOLDER[subfolder]}`,
            });
        });
        //end create folder
        const data = {
            datasetId,
            dataName,
            userUpload,
            savePath,
        };
        const newData = new dataset(data);
        await newData.save();

        cb(null, root + `/${DATA_FOLDER}/${datasetId}/${DATA_SUBFOLDER['uploadsFolder']}` );
   
    
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname +  ".csv");
    },
  });
  const upload = multer({ storage: storage });

  app.post("/api/v1/admin/uploadFile", upload.single("data"), async (req, res, next) => {
    //lưu file xong
      
    }
  );

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
