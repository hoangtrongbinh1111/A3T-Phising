const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();
const Lab = require("./src/lab/lab.model");
const dataRoutes = require("./routes/dataset");
const labRoutes = require("./routes/lab");
const authRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const logRoutes = require("./routes/log");
const blacklistRoutes = require("./routes/blacklist");
const modelRoutes = require("./routes/model");

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
      await _io.emit(`start_training`, {
        data_path: config.config.pre_train_data_path,
        model_type: config.config.pre_train_model_type,
        test_size: config.config.pre_train_test_size,
        number_records: config.config.pre_train_number_records,

        train_num_epoch: config.config.train_num_epoch,
        train_batch_size: config.config.train_batch_size,
        sid: data.sid,
        labId: data.labId,
        content: "train",
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
      var config = await Lab.findOne({ labId: data.labId }, "config");
      _io.emit(`start_testing`, {
        data_path: config.config.pre_train_data_path,
        model_type: config.config.pre_train_model_type,
        test_size: config.config.pre_train_test_size,
        number_records: config.config.pre_train_number_records,

        sid: data.sid,
        labId: data.labId,
        content: "test",
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
        feature_set: config.config.pre_inf_feature_set,

        sid: data.sid,
        labId: data.labId,
        content: "inf",
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
