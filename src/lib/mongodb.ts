// Configuración de base de datos local para desarrollo
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barulogix';

if (!MONGODB_URI) {
  throw new Error('Por favor define la variable MONGODB_URI en .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Para desarrollo local, usar una base de datos en memoria
    if (process.env.NODE_ENV === 'development') {
      // Configuración para desarrollo local
      cached.promise = mongoose.connect('mongodb://localhost:27017/barulogix-dev', opts);
    } else {
      cached.promise = mongoose.connect(MONGODB_URI, opts);
    }
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

