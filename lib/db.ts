import mongoose, { Connection, Mongoose } from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable')
}

interface CachedConnection {
    conn: Connection | null;
    promise: Promise<Mongoose> | null;
}

declare global {
    var mongoose: { conn: Connection | null; promise: Promise<Mongoose> | null };
}

let cached: CachedConnection = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null }
}

async function dbConnect(): Promise<Connection> {
    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        }

        cached.promise = mongoose.connect(MONGODB_URI, opts)
    }

    try {
        const mongoose = await cached.promise
        cached.conn = mongoose.connection
    } catch (e) {
        cached.promise = null
        throw e
    }

    return cached.conn
}

export default dbConnect