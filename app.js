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
    })
    .then(() => {
        console.log("Database connection Success.");
    })
    .catch((err) => {
        console.error("Mongo Connection Error", err);
    });

const app = express();


app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

(async() => {
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
    app.listen(PORT, () => {
        console.log("Server started listening on PORT : " + PORT);
    });
})();