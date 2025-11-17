import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

/**
 * Conexión a MongoDB con caché para evitar múltiples conexiones en dev/hot-reload.
 * Usa:
 *  - MONGODB_URI            (obligatoria)
 *  - MONGODB_DB_NAME        (opcional, recomendada)
 */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Falta la variable de entorno MONGODB_URI. Define MONGODB_URI en tu .env.local"
  );
}

export async function dbConnect() {
  if (!global._mongooseConn) {
    global._mongooseConn = { conn: null, promise: null };
  }

  if (global._mongooseConn.conn) {
    return global._mongooseConn.conn;
  }

  if (!global._mongooseConn.promise) {
    global._mongooseConn.promise = mongoose
      .connect(MONGODB_URI as string, {
        dbName: process.env.MONGODB_DB_NAME,
      })
      .then((m) => m);
  }

  try {
    global._mongooseConn.conn = await global._mongooseConn.promise;
  } catch (err) {
    global._mongooseConn.promise = null;
    throw err;
  }

  return global._mongooseConn.conn;
}
