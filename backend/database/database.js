const mongoose = require('mongoose');

const { MONGO_URI } = process.env;

exports.connect = async () => {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
};