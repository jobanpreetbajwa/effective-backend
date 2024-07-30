const express = require("express");
const dotenv = require("dotenv").config();
const { dbConnect } = require("./config/dbConnect");
const cors = require("cors");
const app = express();
const indexRoute = require("./routes/index");
const swagger = require("./swagger");

dbConnect();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
swagger(app);

app.use("/", indexRoute);

let PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`server started at ${PORT}`);
});
