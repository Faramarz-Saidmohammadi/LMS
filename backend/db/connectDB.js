const mongoose = require("mongoose");

const connectDB = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in .env");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri);

  console.log("✅ MongoDB connected");
};

module.exports = connectDB;
