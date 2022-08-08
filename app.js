const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const logRoutes = require("./routes/log");
const blacklistRoutes = require("./routes/blacklist");

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

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

(async () => {
  app.get("/ping", (req, res) => {
    return res.send({
      status: true,
      message: "Server is healthy",
    });
  });
  
  app.use("/api/v1/users", authRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/log", logRoutes);
  app.use("/api/v1/blacklist", blacklistRoutes);

  const PORT = process.env.PORT || 8686;
  app.listen(PORT, () => {
    console.log("Server started listening on PORT : " + PORT);
  });
})();

