/**
 * Mongoose connection helper.
 *
 * Uses the recommended cached-connection pattern so that the connection is
 * reused across serverless / edge function invocations (cold starts).
 * The connection is only opened at REQUEST time, never at build time, so
 * `next build` succeeds on Vercel even when MONGODB_URI is not set.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

const cached = global.mongoose;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    const err = new Error('Please define the MONGODB_URI environment variable.');
    err.status = 500;
    throw err;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // dbName is inferred from the URI but we set a safe default name.
    };
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
