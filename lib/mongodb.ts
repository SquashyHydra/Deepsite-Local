import mongoose from "mongoose";

function get_mongodb_uri() {
  const username = process.env.MONGODB_USERNAME || "";
  const password = process.env.MONGODB_PASSWORD || "";
  let MONGODB = process.env.MONGODB || "";
  let MONGODB_TYPE = MONGODB.split("//")[0] || "mongodb:";
  MONGODB = MONGODB.split("//")[1] || MONGODB;
  if ( !MONGODB_TYPE.startsWith("mongodb") ) {
    MONGODB_TYPE = `mongodb:`;
  }
  MONGODB_TYPE += "//";
  const dbName = MONGODB.split(".")[0] || "";
  const loginInfo = username || password ? `${(username).trim()}:${(password).trim()}@` : "";
  return `${MONGODB_TYPE}${loginInfo}${(MONGODB).trim()}/`
}

// @ts-expect-error iknown issue with mongoose types
let cached = global.mongoose;

if (!cached) {
  // @ts-expect-error iknown issue with mongoose types
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = get_mongodb_uri();
  
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string)
      .then((mongoose) => {
        return mongoose;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
