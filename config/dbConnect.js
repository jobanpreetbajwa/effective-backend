const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    console.log("connecting to database...",process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("you are successfully connected with db...");
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = { dbConnect };
