import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  try {
    if (cached.conn) {
      console.log("Using cached database connection");
      return cached.conn;
    }

    if (!cached.promise) {
      console.log("Creating new database connection...");
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log("Database connected successfully");
        return mongoose;
      });
    }

    try {
      console.log("Waiting for database connection...");
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      console.error("Error connecting to database:", e);
      cached.promise = null;
      throw e;
    }
  } catch (error) {
    console.error("Database connection error:", error);
    throw new Error(
      `Failed to connect to database: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export default connectDB;
