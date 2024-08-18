const express = require("express");
const dotenv = require("dotenv").config();
const { dbConnect } = require("./config/dbConnect");
const cors = require("cors");
const app = express();
const indexRoute = require("./routes/index");
const swagger = require("./swagger");

// Middleware to await dbConnect
const dbConnectMiddleware = async (req, res, next) => {
  try {
    await dbConnect();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).send("Internal Server Error");
  }
};

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
swagger(app);
app.use(dbConnectMiddleware);
app.get("/hello", async (req, res) => {
  res.send("Hello World!");
})

app.use("/", indexRoute);

// let PORT = process.env.PORT || 3001;

// app.listen(PORT, () => {
//   console.log(`server started at ${PORT}`);
// });


module.exports = app;