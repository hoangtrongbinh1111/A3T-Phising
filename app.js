const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require('path');
require("dotenv").config();

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
const http = require('http');
const server = http.createServer(app);
// const { Server } = require("socket.io");
// const _io = new Server(server);
var _io = require("socket.io")(server, { pingTimeout: 99999999, pingInterval: 99999999 });


app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

(async() => {
    // socket
    _io.on('connection', (socket) => {
        socket.on('start_train_model', async(data) => {
            console.log(socket.id)
            await _io.emit(`start_training`, {
                sid: data.sid,
                content: "test"
            });
        });
        socket.on(`receive_training_process`, async(data) => {

            const temp = JSON.parse(data);
            console.log(temp)
            await _io.emit(`send_training_result_${temp["sid"]}`, temp["response"]);
            console.log('receive_training_process: ', temp["response"]);
        });
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
    server.listen(PORT, () => {
        console.log("Server started listening on PORT : " + PORT);
    });
})();