import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';

let memoryServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    let uri = env.mongodbUri;

    // Fallback to in-memory database if no URI was provided in environment
    if (!uri) {
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      process.stdout.write('[db] In-memory MongoDB instance started\n');
    }

    await mongoose.connect(uri);
    process.stdout.write(`[db] Connected successfully to MongoDB\n`);
  } catch (error) {
    process.stderr.write(`[db] Database connection error: ${(error as Error).message}\n`);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
