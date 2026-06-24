const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB (Atlas cloud cluster or local instance).
 * Exits process on failure since the API cannot function without a DB connection.
 */

const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
const connectDB = async () => {
  try {
    console.log('DNS Servers:', dns.getServers());
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8+ no longer needs useNewUrlParser/useUnifiedTopology, kept for clarity
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
