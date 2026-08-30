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
      // Fail fast: serverless platforms (Netlify free tier) kill functions at
      // 10s. Without these limits a blocked/slow MongoDB connection burns the
      // entire budget and the client sees "Failed to fetch" instead of a
      // clean JSON error.
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS, 10) || 5000,
      connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT_MS, 10) || 5000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS, 10) || 10000,
      // dbName is inferred from the URI but we set a safe default name.
    };
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset so the next request retries instead of replaying a failed promise.
    cached.promise = null;
    console.error('[mongodb] connection failed:', {
      message: e?.message,
      code: e?.code,
      name: e?.name,
      stack: e?.stack,
      uriConfigured: Boolean(MONGODB_URI),
    });
    throw e;
  }

  return cached.conn;
}

export default connectDB;
